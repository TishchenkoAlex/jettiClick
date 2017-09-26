const router = require('express').Router();
const db = require('./db');

router.get('/', (req, res, next) => {
  res.status(200).send('Jetti API');
})

router.get('/catalogs', async (req, res, next) => {
  try {
    res.json(await db.manyOrNone(`SELECT * FROM config_schema WHERE type LIKE 'Catalog.%'`));
  } catch (err) { next(err.message); }
})

router.get('/documents', async (req, res, next) => {
  try {
    res.json(await db.manyOrNone(`SELECT * FROM config_schema WHERE type LIKE 'Documents.%'`));
  } catch (err) { next(err.message); }
})

async function ExecuteScript(doc, script, tx) {
  const Registers = { Account: [], Accumulation: [], Info: [] };

  const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
  const func = new AsyncFunction('doc, Registers, tx', script);
  await func(doc, Registers, tx);
  Registers.Account.forEach(async rec => {
    await tx.none(`
        INSERT INTO "Register.Account" (
          datetime, document, operation, sum, company,
          dt, dt_subcount1, dt_subcount2, dt_subcount3, dt_subcount4, dt_qty, dt_cur,
          kt, kt_subcount1, kt_subcount2, kt_subcount3, kt_subcount4, kt_qty, kt_cur ) 
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        );`, [
        new Date(doc.date), doc.id, rec.operation || doc.doc.Operation, rec.sum, rec.company || doc.company,
        rec.debit.account, rec.debit.subcounts[0], rec.debit.subcounts[1], rec.debit.subcounts[2], rec.debit.subcounts[3],
        rec.debit.qty, rec.debit.currency || doc.doc.currency,
        rec.kredit.account, rec.kredit.subcounts[0], rec.kredit.subcounts[1], rec.kredit.subcounts[2], rec.kredit.subcounts[3],
        rec.kredit.qty, rec.kredit.currency || doc.doc.currency
      ]
    );
  });

  Registers.Accumulation.forEach(async rec => {
    await tx.none(`INSERT INTO "Register.Accumulation" (kind, type, date, document, company, data) 
    VALUES ($1,$2,$3,$4,$5,$6)`,[ 
      rec.kind, rec.type, new Date(doc.date), doc.id, rec.company || doc.company, rec.data
    ]);
  });

  Registers.Info.forEach(async rec => {
    await tx.none(`INSERT INTO "Register.Info" (type, date, document, company, data) 
    VALUES ($1,$2,$3,$4,$5,$6)`,[ 
      rec.kind, rec.type, new Date(doc.date), doc.id, rec.company || doc.company, rec.data
    ]);
  });


  if (Registers.Info.length) {
    const rec = Registers.Info[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    await tx.none(`INSERT INTO "Register.Info" VALUES ($1,$2,$3,$4)`, arr);
  };
  return doc;
}

// Select documents list for UI (grids/list etc)
router.get('/:type/list', async (req, res, next) => {
  try {
    const count = req.query.$count || '';
    const skip = (req.query.$skip || req.query.start || 0) * 1;
    const top = (req.query.$top || req.query.count || 50) * 1;
    const filter = req.query.$filter ? ' AND ' + decodeURI(req.query.$filter).replace(/\*/g, '%') : ' ';
    const config_schema = await db.one(`SELECT "queryList" FROM config_schema WHERE type = $1`, [req.params.type]);
    const order = req.query.$order ? `ORDER BY ${req.query.$order}` : 'ORDER BY d.type, d.date, d.code';
    const query = `SELECT * FROM (
      ${config_schema.queryList} ) d WHERE true 
      ${filter}
      ${order} 
      OFFSET ${skip} LIMIT ${top};`;
    // SELECT to_jsonb(COUNT(*)) count FROM ${config_schema.queryList.split('FROM')[1]}`;
    const data = await db.manyOrNone(query);
    const total_count = data.length + skip + (data.length === top ? 1 : 0);
    res.json({ total_count: total_count, data: data });
  } catch (err) { next(err.message); }
});

router.get('/:type/view/*', async (req, res, next) => {
  try {
    const config_schema = await db.one(`
      SELECT "queryObject", "queryNewObject",
        (SELECT schema FROM config_schema WHERE type = 'doc') || config_schema.schema AS "schemaFull"
      FROM config_schema WHERE type = $1`, [req.params.type]);
    const view = config_schema.schemaFull;
    let model, id = req.params['0'];
    if (id) {
      if (id.startsWith('copy-')) {
        model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [id.slice(5)]);
        newDoc = await db.one('SELECT uuid_generate_v1mc() id, now() date');
        model.id = newDoc.id; model.date = newDoc.date; model.code = '';
        model.posted = false; model.deleted = false;
        model.description = 'Copy: ' + model.description;
      } else
        model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
    } else
      model = config_schema.queryNewObject ? await db.one(`${config_schema.queryNewObject}`) : {};
    const result = { view: view, model: model };
    res.json(result);
  } catch (err) { next(err.message); }
})


router.get('/suggest/:id', async (req, res, next) => {
  try {
    const query = `
      SELECT id as id, description as value, code as code, type as type
      FROM "Documents" WHERE id = $1`;
    const data = await db.oneOrNone(query, req.params.id);
    res.json(data);
  } catch (err) { next(err.message); }
})

router.get('/suggest/:type/*', async (req, res, next) => {
  try {
    const query = `
      SELECT id as id, description as value, code as code, type as type
      FROM "Documents" WHERE type = '${req.params.type}'
      AND (description ILIKE '%${req.params[0]}%' OR code ILIKE '%${req.params[0]}%' OR id = '${req.params[0]}')
      ORDER BY type, description LIMIT 10`;
    const data = await db.manyOrNone(query);
    res.json(data);
  } catch (err) { next(err.message); }
})

// Delete document
router.delete('/:id', async (req, res, next) => {
  try {
    const t = await db.tx(async tx => {
      const id = req.params.id;
      let doc = await DocById(id, tx)
      await doSubscriptions(doc, 'before detele', tx);
      const config_schema = (await tx.one(`SELECT "queryObject", "beforeDelete", "afterDelete" FROM config_schema WHERE type = $1`, [doc.type]));
      if (config_schema['beforeDelete']) await ExecuteScript(doc, config_schema['beforeDelete'], tx);
      doc = await tx.one('UPDATE "Documents" SET deleted = not deleted, posted = false WHERE id = $1 RETURNING *;', [id]);
      if (config_schema['afterDelete']) await ExecuteScript(doc, config_schema['afterDelete'], tx);
      await doSubscriptions(doc, 'after detele', tx);
      const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
      res.json(model);
    });
  } catch (err) { next(err.message); }
})

// Upsert document
async function post(req, res, next) {
  let result;
  const t = await db.tx(async tx => {
    let doc = req.body, id = doc.id;
    const isNew = (await tx.oneOrNone('SELECT id FROM "Documents" WHERE id = $1', [id]) === null);
    await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
    const config_schema = (await tx.one(`
      SELECT "queryObject", replace("beforePost", '$.', 'doc.doc.') "beforePost", 
        replace("afterPost", '$.', 'doc.doc.') "afterPost" FROM config_schema WHERE type = $1`, [doc.type]));
    await tx.none(`
        DELETE FROM "Register.Account" WHERE document = $1;
        DELETE FROM "Register.Info" WHERE document = $1;
        DELETE FROM "Register.Accumulation" WHERE document = $1;`, id);
    if (!!doc.posted && config_schema['beforePost']) await ExecuteScript(doc, config_schema['beforePost'], tx);
    if (isNew) doc = await tx.one(`INSERT INTO "Documents" SELECT * FROM json_populate_record(null::"Documents", $1) RETURNING *;`, [doc]);
    else {
      doc = await tx.one(`
        UPDATE "Documents" d  
          SET
            type = i.type, parent = i.parent,
            date = i.date, code = i.code, description = i.description,
            posted = i.posted, deleted = i.deleted, isfolder = i.isfolder,
            "user" = i.user, company = i.company,
            doc = i.doc
          FROM (SELECT * FROM json_populate_record(null::"Documents", $1)) i
          WHERE d.id = i.id RETURNING *;`, [doc]);
    }
    if (!!doc.posted && config_schema['afterPost']) await ExecuteScript(doc, config_schema['afterPost'], tx);
    await doSubscriptions(Object.assign({}, doc), isNew ? 'after insert' : 'after update', tx);
    result = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [doc.id]);
  });
  return result;
}

// Upsert document
router.post('/', async (req, res, next) => {
  try {
    res.json(await post(req, res, next));
  } catch (err) { next(err.message); }
})

// Post by id (without returns posted object to client, for post in cicle many docs)
router.get('/post/:id', async (req, res, next) => {
  try {
    req.body = await DocById(req.params.id, db);
    req.body.posted = !req.body.posted;
    await post(req, res, next);
    res.json(true);
  } catch (err) { next(err.message); }
})

async function doSubscriptions(doc, script, db) {
  const scripts = await db.manyOrNone(`
    SELECT "then" FROM "Subscriptions" WHERE "what" ? $1 AND "when" = $2 ORDER BY "order"`, [doc.type, script]);
  const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
  for (let i = 0; i < scripts.length; i++) {
    const func = new AsyncFunction('doc, db', scripts[i].then);
    await func(doc, db);
  };
}

// Get document by id ROUTE
router.get('/raw/:id', async (req, res, next) => {
  try {
    res.json(await DocById(req.params.id, db));
  } catch (err) { next(err.message); }
})

// Get document by id
async function DocById(id, db) {
  return await db.oneOrNone(`select * from "Documents" WHERE id = $1`, [id]);
}

router.get('/register/account/movements/view/:id', async (req, res, next) => {
  try {
    const query = `SELECT * FROM "Register.Account.View" where document_id = $1`;
    const data = await db.manyOrNone(query, [req.params.id]);
    res.json(data);
  } catch (err) { next(err.message); }
})

module.exports = router;

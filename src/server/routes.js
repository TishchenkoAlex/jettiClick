const router = require('express').Router();
const db = require('./db');

router.get('/', (req, res, next) => {
  res.status(200).send('Jetti API');
})

router.get('/catalogs', async (req, res, next) => {
  try {
    const data = await db.manyOrNone(`SELECT * FROM config_schema_helper WHERE type LIKE 'Catalog.%'`);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
})

router.get('/documents', async (req, res, next) => {
  try {
    const data = await db.manyOrNone(`SELECT * FROM config_schema_helper WHERE type LIKE 'Documents.%'`);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
})

async function ExecuteScript(doc, script, db) {
  const Registers = { Account: [], Accumulation: [], Info: [] };
  const func = new Function('doc, Registers', script);
  const result = func(doc, Registers);
  if (Registers.Account.length) {
    const rec = Registers.Account[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    const d = await db.none(`
      INSERT INTO "Register.Account" 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, arr);
  };
  if (Registers.Accumulation.length) {
    const rec = Registers.Accumulation[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    const d = await db.none(`
      INSERT INTO "Register.Accumulation" VALUES ($1,$2,$3,$4)`, arr);
  };
  if (Registers.Info.length) {
    const rec = Registers.Info[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    const d = await db.none(`
      INSERT INTO "Register.Info" VALUES ($1,$2,$3,$4)`, arr);
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
    const doctype = req.params.type;
    const config_schema = await db.one(`SELECT "queryList" FROM config_schema WHERE type = $1`, [doctype]);
    const order = req.query.$order ? `ORDER BY ${req.query.$order}` : 'ORDER BY d.type, d.date, d.code';
    const query = `
      ${config_schema.queryList}
      ${filter}
      ${order} 
      OFFSET ${skip} LIMIT ${top};
      SELECT to_jsonb(COUNT(*)) count FROM ${config_schema.queryList.split('FROM')[1]}
      ${filter}`;
    const data = await db.manyOrNone(query);
    const total_count = data[data.length - 1].count;
    data.length--;
    res.json({ total_count: total_count, data: data });
  } catch (err) {
    next(err.message);
  }
});

router.get('/:type/view/*', async (req, res, next) => {
  try {
    const config_schema = await db.one(`
          select "schemaFull", "queryObject", "queryNewObject"  
          from config_schema_helper where type = $1`, [req.params.type]);
    const view = config_schema.schemaFull;
    let model;
    if (req.params['0']) {
      model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [req.params['0']]);
    } else {
      model = await db.one(`${config_schema.queryNewObject}`);
      const result = { view: view, model: model };
      res.json(result);
      return;
    }
    model = { ...model, ...model['doc'] };
    delete model['doc'];
    const result = { view: view, model: model };
    res.json(result);
  } catch (err) {
    next(err.message);
  }
})

router.get('/suggest/:type/*', async (req, res, next) => {
  try {
    const query = `
      SELECT id as id, description as value, code as code, type as type
      FROM "Documents" WHERE type = '${req.params.type}'
      AND (description ILIKE '%${req.params[0]}%' OR code ILIKE '%${req.params[0]}%' OR id = '${req.params[0]}')
      ORDER BY description
      LIMIT 10`;
    const data = await db.manyOrNone(query);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
})

// Delete document
router.delete('/:id', async (req, res, next) => {
  try {
    const t = await db.tx(async tx => {
      const id = req.params;
      const doc = await DocById(id, tx)
      await doSubscriptions(doc, 'before detele', tx);
      const scripts = (await tx.one(`SELECT "scripts" FROM config_schema WHERE type = $1`, [doc.type])).scripts;
      if (scripts && scripts['before-delete']) await ExecuteScript(doc, scripts['before-delete'], tx);
      await tx.none('UPDATE "Documents" SET deleted = not deleted WHERE id = $1', [id]);
      if (scripts && scripts['after-delete']) await ExecuteScript(data, scripts['after-delete'], tx);
      await doSubscriptions(doc, 'after detele', tx);
    });
  } catch (err) {
    next(err.message);
  }
})

// Upsert document
router.post('/', async (req, res, next) => {
  try {
    const t = await db.tx(async tx => {
      let doc = req.body, id = doc.id;
      await doSubscriptions(doc, 'before update', tx);
      const scripts = (await tx.one(`SELECT "scripts" FROM config_schema WHERE type = $1`, [doc.type])).scripts;
      if (scripts && scripts['before-post']) await ExecuteScript(doc, scripts['before-post'], tx);
      const data = await tx.oneOrNone('SELECT id FROM "Documents" WHERE id = $1', [id]);
      if (data === null) {
        doc = await tx.one(`
      INSERT INTO "Documents" SELECT * FROM json_populate_record(null::"Documents", $1);
      SELECT * FROM "Documents" WHERE id = $2`, [doc, id]);
      } else {
        doc = await tx.one(`
        UPDATE "Documents" d  
          SET
            type = i.type,
            parent = i.parent,
            date = i.date,
            code = i.code,
            description = i.description,
            posted = i.posted, 
            deleted = i.deleted,
            isfolder = i.isfolder,
            doc = i.doc
          FROM (SELECT * FROM json_populate_record(null::"Documents", $1)) i
          WHERE d.Id = i.Id;
          SELECT * FROM "Documents" WHERE id = $2`, [doc, id]);
      }
      if (scripts && scripts['after-post']) await ExecuteScript(doc, scripts['after-post'], tx);
      await doSubscriptions(doc, 'after update', tx);
      res.json(doc);
    });
  } catch (err) {
    next(err.message);
  }
})

async function doSubscriptions(doc, script, db) {
  const scripts = await db.manyOrNone(`
    SELECT "then" FROM "Subscriptions" WHERE "what" ? $1 AND "when" = $2 ORDER BY "order"`, [doc.type, script]);
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  for (let i = 0; i < scripts.length; i++) {
    const func = new AsyncFunction('doc, db', scripts[i].then);
    const result = await func(doc, db);
  };
}

// Get document by id ROUTE
router.get('/raw/:id', async (req, res, next) => {
  try {
    data = await DocById(req.params.id, db);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
})

// Get document by id
async function DocById(id, db) {
  const query = `select * from "Documents" WHERE id = $1`;
  const result = await db.oneOrNone(query, [id]);
  return result;
}

module.exports = router;

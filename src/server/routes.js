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

async function ExecuteScript(doc, script, t) {
  const Registers = { Account: [], Accumulation: [], Info: [] };
  var func = new Function('doc, Registers', script);
  const result = func(doc, Registers);
  if (Registers.Account.length) {
    const rec = Registers.Account[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    const d = await t.none(`
      INSERT INTO "Register.Account" 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, arr);
  };
  if (Registers.Accumulation.length) {
    const rec = Registers.Accumulation[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    const d = await t.none(`
      INSERT INTO "Register.Accumulation" VALUES ($1,$2,$3,$4)`, arr);
  };
  if (Registers.Info.length) {
    const rec = Registers.Info[0];
    let arr = [];
    for (let key in rec) { if (rec.hasOwnProperty(key)) { arr.push(rec[key]) } }
    const d = await t.none(`
      INSERT INTO "Register.Info" VALUES ($1,$2,$3,$4)`, arr);
  };
  return doc;
}

// Select documents list for UI (grids/list etc)
router.get('/:type/list', async (req, res, next) => {
  try {
    let count = req.query.$count || '';
    let skip = (req.query.$skip || req.query.start || 0) * 1;
    let top = (req.query.$top || req.query.count || 50) * 1;
    let filter = req.query.$filter ? ' AND ' + decodeURI(req.query.$filter).replace(/\*/g, '%') : ' ';
    let doctype = req.params.type;
    let config_schema = await db.one(`SELECT "queryList" FROM config_schema WHERE type = $1`, [doctype]);
    const order = req.query.$order ? `ORDER BY ${req.query.$order}` : 'ORDER BY d.type, d.date, d.code';
    let query = `
      ${config_schema.queryList}
      ${filter}
      ${order} 
      OFFSET ${skip} LIMIT ${top};
      SELECT to_jsonb(COUNT(*)) count FROM ${config_schema.queryList.split('FROM')[1]}
      ${filter}`;
    let data = await db.manyOrNone(query);
    const total_count = data[data.length - 1].count;
    data.length--;
    res.json({ total_count: total_count, data: data });
  } catch (err) {
    next(err.message);
  }
});

var clearObjectValues = (obj) => {
  for (var key in obj) {
    if (obj[key] && typeof obj[key] === "object") {
      clearObjectValues(obj[key]);
    } else {
      switch (typeof obj[key]) {
        case "boolean":
          obj[key] = false;
          break
        case "number":
          obj[key] = 0;
          break
        default: if (key !== 'type') obj[key] = ''
      }
    }
  }
}

router.get('/:type/view/*', async (req, res, next) => {
  try {
    const config_schema = await db.one(`
          select uuid_generate_v1mc() id, now() date, "schemaFull", "queryObject"  
          from config_schema_helper where type = $1`, [req.params.type]);
    const view = config_schema.schemaFull;
    let model;
    if (req.params['0']) {
      model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [req.params['0']]);
    } else {
      model = await db.many(`
        ${config_schema.queryObject} LIMIT 1;
        SELECT 
          (select max(code) from "Documents" where type = $1) as "nextCode",
          (select description from config_schema where type = $1) as "nextDescription"
      `, [req.params.type]);
      const code = ((parseInt(model[1].nextCode, 36) + 1).toString(36));
      const description = `${model[1].nextDescription} #${code}`;
      model = model[0];
      clearObjectValues(model);
      model.id = config_schema.id;
      model.date = config_schema.date;
      model.type = req.params.type;
      model.posted = false;
      model.deleted = false;
      model.isfolder = false;
      model.code = code;
      model.description = description;
      delete model.nextCode;
      delete model.nextDescription;
      const result = { view: view, model: model };
      res.json(result);
      return;
    }
    const newModel = { ...model, ...model['doc'] };
    delete newModel['doc'];
    const result = { view: view, model: newModel };
    res.json(result);
  } catch (err) {
    next(err.message);
  }
})

router.get('/suggest/:type/*', async (req, res, next) => {
  try {
    let query = `
      SELECT id as id, description as value, code as code, type as type
      FROM "Documents" WHERE type = '${req.params.type}'
      AND (description ILIKE '%${req.params[0]}%' OR code ILIKE '%${req.params[0]}%' OR id = '${req.params[0]}')
      ORDER BY description
      LIMIT 10`;
    let data = await db.manyOrNone(query);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
})

// Get document by id
router.get('/raw/:id', async (req, res, next) => {
  try {
    const query = `select * from "Documents" WHERE id = '${req.params.id}'`;
    let data = await db.oneOrNone(query);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
})

// Delete document
router.delete('/:id', async (req, res, next) => {
  try {
    const t = await db.tx('my-transaction', async t => {
      const scripts = (await t.one(`SELECT "scripts" FROM config_schema WHERE type = $1`, [doc.type])).scripts;      
      if (scripts && scripts['before-delete']) await ExecuteScript(doc, scripts['before-delete'], t);
      let id = req.params;
      await t.none('UPDATE "Documents" SET deleted = not deleted WHERE id = $1', [id]);
      if (scripts && scripts['after-delete']) await ExecuteScript(data, scripts['after-delete'], t);
    });
  } catch (err) {
    next(err.message);
  }
})

// Upsert document
router.post('/', async (req, res, next) => {
  try {
    const t = await db.tx('my-transaction', async t => {
      const doc = req.body, id = doc.id;
      const scripts = (await t.one(`SELECT "scripts" FROM config_schema WHERE type = $1`, [doc.type])).scripts;
      if (scripts && scripts['before-post']) await ExecuteScript(doc, scripts['before-post'], t);
      let data = await t.oneOrNone('SELECT id FROM "Documents" WHERE id = $1', [id]);
      if (data === null) {
        data = await t.one(`
      INSERT INTO "Documents" SELECT * FROM json_populate_record(null::"Documents", $1);
      SELECT * FROM "Documents" WHERE id = $2`, [doc, id]);
      } else {
        data = await t.one(`
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
      if (scripts && scripts['after-post']) await ExecuteScript(data, scripts['after-post'], t);
      res.json(data);
    });
  } catch (err) {
    next(err.message);
  }
})

module.exports = router;

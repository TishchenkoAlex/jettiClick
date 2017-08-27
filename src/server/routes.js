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

// raw docs
router.get('/:type', async (req, res, next) => {
  try {
    if (req.query.sort) {
      let sortField = Object.keys(req.query.sort)[0];
      req.query.$order = sortField + " " + req.query.sort[sortField];
    }
    let count = req.query.$count;
    let skip = (req.query.$skip || req.query.start || 0) * 1;
    let top = (req.query.$top || req.query.count || 100) * 1;
    let filter = req.query.$filter ? ' AND ' + decodeURI(req.query.$filter).replace(/\*/g, '%') : ' ';
    let doctype = req.params.type;
    let schema = await db.one(`SELECT fields as orderFields FROM config_schema WHERE type = $1`, [doctype]);
    let fields = count === '' ? ' COUNT(*)' : ' * ';
    let orderFields = schema.orderFields || ' * ';
    let orderField = undefined;
    if (req.query.$order) orderField = orderFields[req.query.$order.split(' ')[0]];
    if (!orderField) orderField = req.query.$order;
    else orderField = orderField + ' ' + (req.query.$order.split(' ')[1] || ' asc');
    const order = req.query.$order ?
      ' ORDER BY ' + orderField : count === '' ? ' ' : ' ORDER BY type, date, code ';
    let query = `
      SELECT ${fields}   
      FROM "Documents" main WHERE type = '${doctype}'
      ${filter}
      ${order} 
      OFFSET ${skip} LIMIT ${top}`;
    const data = await db.manyOrNone(query);
    const result = data
    res.json(result);
  } catch (err) {
    next(err.message);
  }
})

function ExecuteScript(doc, scripts) {
  if (!(scripts && scripts['post'])) return;
  var postF = new Function('doc', scripts.post)
  postF(doc);
  return doc;
}

// Select documents list
router.get('/:type/list', async (req, res, next) => {
  var func1 = new Function('a, b', 'return a + b');
  try {
    if (req.query.sort) {
      let sortField = Object.keys(req.query.sort)[0];
      req.query.$order = sortField + " " + req.query.sort[sortField];
    }
    let count = req.query.$count;
    let skip = (req.query.$skip || req.query.start || 0) * 1;
    let top = (req.query.$top || req.query.count || 100) * 1;
    let filter = req.query.$filter ? ' AND ' + decodeURI(req.query.$filter).replace(/\*/g, '%') : ' ';
    let doctype = req.params.type;
    let schema = await db.one(`
          SELECT 
           (SELECT query FROM config_schema WHERE type = 'doc') ||
           coalesce((SELECT ', '|| query FROM config_schema WHERE type = $1), '') AS "selectFields",
           (SELECT fields FROM config_schema WHERE type = $1) AS "orderFields",
           (SELECT scripts FROM config_schema WHERE type = $1) AS "scripts"`, [doctype]);
    let fields = schema.selectFields;
    if (count === '') fields = ' COUNT(*) ';
    let orderFields = schema.orderFields || ' * ';
    let orderField = undefined;
    if (req.query.$order) orderField = orderFields[req.query.$order.split(' ')[0]];
    if (!orderField) orderField = req.query.$order;
    else orderField = orderField + ' ' + (req.query.$order.split(' ')[1] || ' asc');
    let order = req.query.$order ?
      ' ORDER BY ' + orderField : count === '' ? ' ' : ' ORDER BY type, date, code ';
    let query = `
      SELECT ${fields}    
      FROM "Documents" main WHERE type = '${doctype}'
      ${filter}
      ${order} 
      OFFSET ${skip} LIMIT ${top}`;
    let data = await db.manyOrNone(query);
    const result = data;
    //const newData = data.map(r => { return ExecuteScript(r, schema.scripts)});
    //const newDoc = ExecuteScript(data[0], schema.scripts);
    res.json(data);
  } catch (err) {
    next(err.message);
  }
});

var clearObjectValues = (obj) => {
  for (var key in obj) {
    if (obj[key] && typeof obj[key] === "object") {
      clearObjectValues(obj[key]);
    } else {
      if (typeof obj[key] === "boolean") {
        obj[key] = false;
      } else {
        obj[key] = '';
      }
    }
  }
}

var crateObjectFromView = (model, view) => {
  for (var key in view) {
    if (view[key] && view[key].constructor == Array) {
      model[key] = [{}];
      crateObjectFromView(model[key][0], view[key][0]);
    } else {
      if (typeof view[key] === "boolean") {
        model[key] = false;
      } else {
        if (view[key] && view[key]['type'] && view[key]['type'] === "number") {
          model[key] = 0;
        } else {
          if (view[key] && view[key]['type'] && view[key]['type'].indexOf('.') > -1) {
            model[key] = { id: '', code: '', description: '', type: view[key]['type'] }
          }
          else {
            model[key] = '';
          }
        }
      }
    }
  }
}

function isUUID(str) {
  const pattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  return pattern.test(str);
}

function setComplexType(obj, promises) {
  for (var param in obj) {
    if (param === 'id') { continue; }
    if (obj[param] && typeof obj[param] === "object") {
      setComplexType(obj[param], promises);
    } else {
      if (isUUID(obj[param])) {
        const query = `select id as id, description as value, code as code, type as type from "Documents" WHERE id = '${obj[param]}'`;
        data = db.oneOrNone(query);
        obj[param] = data;
        promises.push(obj[param]);
      }
    }
  }
}

function resolveComplexType(obj, values) {
  for (var param in obj) {
    if (param === 'id') { continue; }
    if (obj[param] && obj[param].toString().startsWith('[object Object')) {
      resolveComplexType(obj[param], values);
    } else {
      if (obj[param] && obj[param].toString() === '[object Promise]') {
        obj[param] = values.pop();
      }
    }
  }
}

router.get('/:type/view/*', async (req, res, next) => {
  try {
    const view = await db.one(`
          select uuid_generate_v1mc() id, now() date, "selectQuery", "full"  
          from config_schema_helper where type = $1`, [req.params.type]);
    let model;
    if (req.params['0']) {
      model = await db.one(`select * from "Documents" WHERE id = $1`, [req.params['0']]);
    } else {
      model = await db.one(`SELECT 
        (select max(code) from "Documents" where type = $1) as "nextCode",
        (select description from config_schema where type = $1) as "nextDescription"
        `, [req.params.type]);
      crateObjectFromView(model, view.full);
      const code = ((parseInt(model.nextCode, 36) + 1).toString(36));
      const description = `${model.nextDescription} #${code}`;
      model.id = view.id;
      model.date = view.date;
      model.type = req.params.type;
      model.posted = false;
      model.deleted = false;
      model.isfolder = false;
      model.code = code;
      model.description = description;
      delete model.nextCode;
      delete model.nextDescription;
      const result = { view: view.full, model: model };
      res.json(result);
      return;
    }

    const promises = [];
    setComplexType(model, promises);
    const resolves = await Promise.all(promises);
    resolveComplexType(model, resolves.reverse());
    const newModel = { ...model, ...model['doc'] };
    delete newModel['doc'];
    const result = { view: view.full, model: newModel };
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
router.get('/:id', async (req, res, next) => {
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
    let id = req.params;
    await db.none('UPDATE "Documents" SET deleted = not deleted WHERE id = $1', [id]);
  } catch (err) {
    next(err.message);
  }
})

// Upsert document
router.post('/', async (req, res, next) => {
  try {
    let doc = req.body,
      id = doc.id;
    let data = await db.oneOrNone('SELECT id FROM "Documents" WHERE id = $1', [id]);
    if (data == null) {
      data = await db.one(`
              INSERT INTO "Documents" SELECT * FROM json_populate_record(null::"Documents", $1);
              SELECT * FROM "Documents" WHERE id = $2`, [doc, id]);
      res.json(data);
    } else {
      let data = await db.one(`
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
      res.json(data);
    }
  } catch (err) {
    next(err.message);
  }
})

module.exports = router;

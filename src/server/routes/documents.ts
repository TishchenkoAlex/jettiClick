import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { ITask } from 'pg-promise';

import { db } from './../db';
import { ColumnDef } from './../models/column';
import { FormListSettings } from './../models/user.settings';
import { IDocBase, RefValue } from './../modules/doc.base';
import { JDM } from './../modules/index';
import { buildColumnDef } from './../routes/utils/columns-def';
import { lib } from './../std.lib';
import { docOperationResolver, doSubscriptions, ExecuteScript } from './utils/execute-script';
import { List } from './utils/list';

export const router = express.Router();

// Select documents list for UI (grids/list etc)
router.post('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await List(req, res);
    res.json(result);
  } catch (err) { next(err.message); }
});

router.get('/:type/view/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
    const config_schema = await db.one(`
      SELECT "queryObject", "queryNewObject",
        (select settings->'${req.params.type}' result from users where email = '${user}') settings,
        (SELECT schema FROM config_schema WHERE type = 'doc') || config_schema.schema AS "schemaFull"
      FROM config_schema WHERE type = $1`, [req.params.type]);
    const view = config_schema.schemaFull;
    const columnDef: ColumnDef[] = buildColumnDef(view, config_schema.settings || new FormListSettings());

    let model; const id = req.params['0'];
    if (id) {
      if (id.startsWith('copy-')) {
        model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [id.slice(5)]);
        const newDoc = await db.one('SELECT uuid_generate_v1mc() id, now() date');
        model.id = newDoc.id; model.date = newDoc.date; model.code = '';
        model.posted = false; model.deleted = false;
        model.parent = { ...model.parent, id: null, code: null, value: null };
        model.description = 'Copy: ' + model.description;
      } else {
        if (id.startsWith('base-')) {
          model = await db.one(`${config_schema.queryNewObject}`);
          const source = await lib.doc.modelById(id.slice(5));
          model = { ...model, ...source };
        } else {
          model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
        }
      }
      await docOperationResolver(model, db);
    } else {
      model = config_schema.queryNewObject ? await db.one(`${config_schema.queryNewObject}`) : {};
    }
    const result = { view: view, model: model, columnDef: columnDef };
    res.json(result);
  } catch (err) { next(err.message); }
})

// Delete document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async tx => {
      const id = req.params.id;
      let doc = await lib.doc.byId(id, tx)
      await doSubscriptions(doc, 'before detele', tx);
      const config_schema = (await tx.one(`
        SELECT "queryObject", "beforeDelete", "afterDelete" FROM config_schema WHERE type = $1`, [doc.type]));
      if (config_schema['beforeDelete']) { await ExecuteScript(doc, config_schema['beforeDelete'], tx); }
      doc = await tx.one('UPDATE "Documents" SET deleted = not deleted, posted = false WHERE id = $1 RETURNING *;', [id]);
      if (config_schema['afterDelete']) { await ExecuteScript(doc, config_schema['afterDelete'], tx); }
      await doSubscriptions(doc, 'after detele', tx);
      const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
      await docOperationResolver(model, tx);
      res.json(model);
    });
  } catch (err) { next(err.message); }
})

// Upsert document
async function post(doc: IDocBase, tx: ITask<any>) {
  const id = doc.id;
  const isNew = (await tx.oneOrNone('SELECT id FROM "Documents" WHERE id = $1', [id]) === null);
  await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
  const config_schema = (await tx.one(`
      SELECT "queryObject", replace("beforePost", '$.', 'doc.doc.') "beforePost",
        replace("afterPost", '$.', 'doc.doc.') "afterPost" FROM config_schema WHERE type = $1`, [doc.type]));
  await tx.none(`
        DELETE FROM "Register.Account" WHERE document = $1;
        DELETE FROM "Register.Info" WHERE document = $1;
        DELETE FROM "Register.Accumulation" WHERE document = $1;`, id);
  if (!!doc.posted && config_schema['beforePost']) { await ExecuteScript(doc, config_schema['beforePost'], tx); }
  if (isNew) {
    doc = await tx.one(`
      INSERT INTO "Documents" SELECT * FROM json_populate_record(null::"Documents", $1) RETURNING *;`, [doc]);
  } else {
    doc = await tx.one(`
        UPDATE "Documents" d
          SET
            type = i.type, parent = i.parent,
            date = i.date, code = i.code, description = i.description,
            posted = i.posted, deleted = i.deleted, isfolder = i.isfolder,
            "user" = i.user, company = i.company, info = i.info,
            doc = i.doc
          FROM (SELECT * FROM json_populate_record(null::"Documents", $1)) i
          WHERE d.id = i.id RETURNING *;`, [doc]);
  }
  if (!!doc.posted) { await ExecuteScript(doc, config_schema['afterPost'] || 'post', tx); }
  await doSubscriptions(JSON.parse(JSON.stringify(doc)), isNew ? 'after insert' : 'after update', tx);
  return doc;
}

// Upsert document
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let doc;
    await db.tx(async (tx: ITask<any>) => {
      doc = await post(req.body, tx);
      const config_schema = await tx.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
      doc = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [doc.id]);
      await docOperationResolver(doc, tx);
    });
    res.json(doc);
  } catch (err) { next(err.message); }
})

// Post by id (without returns posted object to client, for post in cicle many docs)
router.get('/post/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async (tx: ITask<any>) => {
      const doc = await lib.doc.byId<IDocBase>(req.params.id, tx);
      doc.posted = !doc.posted;
      await post(doc, tx);
    });
    res.json(true);
  } catch (err) { next(err.message); }
})

// Get document by id ROUTE
router.get('/raw/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await lib.doc.byId(req.params.id, db));
  } catch (err) { next(err.message); }
})

router.post('/valueChanges/:type/:property', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = req.body.doc as IDocBase;
    const value = req.body.value as RefValue;
    const property = req.params.property as string;
    const type = req.params.type as string;

    const result = JDM[type] && JDM[type].valueChanges && JDM[type].valueChanges[property] ?
      await JDM[type].valueChanges[property](doc, value) : {};
    res.json(result);
  } catch (err) { next(err.message); }
})



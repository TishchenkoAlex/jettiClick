import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { DocumentBase, DocumentOptions } from '../../server/models/document';
import { PatchValue, RefValue } from '../models/api';
import { createDocumentServer } from '../models/documents.factory.server';
import { DocTypes } from '../models/documents.types';
import { db, TX } from './../db';
import { ColumnDef } from './../models/column';
import { configSchema } from './../models/config';
import { DocumentBaseServer, INoSqlDocument } from './../models/ServerDocument';
import { FormListSettings } from './../models/user.settings';
import { buildColumnDef } from './../routes/utils/columns-def';
import { lib, postById } from './../std.lib';
import { User } from './user.settings';
import { doSubscriptions, InsertRegisterstoDB } from './utils/execute-script';
import { List } from './utils/list';
import { DocumentOperation } from '../models/Documents/Document.Operation';
import { createDocument } from '../models/documents.factory';
import { CatalogOperation } from '../models/Catalogs/Catalog.Operation';
import { SQLGenegator } from '../fuctions/SQLGenerator';

export const router = express.Router();

// Select documents list for UI (grids/list etc)
router.post('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await List(req, res));
  } catch (err) { next(err); }
});


const viewAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let config_schema; let view;
    const user = User(req);
    const serverDoc = configSchema.get(req.params.type);

    view = Object.assign({}, serverDoc.Props);
    config_schema = {
      queryObject: serverDoc.QueryObject,
      queryNewObject: serverDoc.QueryNew,
      settings: ((await db.oneOrNone(`SELECT settings->'${req.params.type}' settings from users where email = '${user}'`)) || {}).settings,
      schemaFull: view,
      prop: serverDoc.Prop
    };

    const columnDef = buildColumnDef(view, config_schema.settings || new FormListSettings());

    let model; const id = req.params['0']; const OperationID = req.params['1'];
    if (id) {
      if (id === 'new') {
        model = config_schema.queryNewObject ? await db.one(`${config_schema.queryNewObject}`) : {};
      } else {
        if (id.startsWith('copy-')) {
          model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [id.slice(5)]);
          const newDoc = await db.one(`${config_schema.queryNewObject}`);
          model.id = newDoc.id; model.date = newDoc.date; model.code = newDoc.code;
          model.posted = false; model.deleted = false;
          model.parent = { ...model.parent, id: null, code: null, value: null };
          model.description = 'Copy: ' + model.description;
        } else {
          if (id.startsWith('base-')) {
            const newDoc = createDocumentServer<DocumentBaseServer>(req.params.type);
            model = await newDoc.baseOn(id.slice(5), db);
          } else {
            if (id.startsWith('folder-')) {
              model = config_schema.queryNewObject ? await db.one(`${config_schema.queryNewObject}`) : {};
              const parentDoc = await db.oneOrNone(`${config_schema.queryObject} AND d.id = $1`, [id.slice(7)]) || {};
              // tslint:disable-next-line:max-line-length
              const parent = { ...model.parent, id: parentDoc.id || null, code: parentDoc.code || null, value: parentDoc.description || null };
              model.parent = parent;
              model.isfolder = true;
            } else {
              if (serverDoc.type === 'Document.Operation') {
                const Parameters = await db.one(`
                  select doc -> 'Parameters' "Parameters" from "Documents"
                  where id = (select doc ->> 'Operation' from "Documents" where id = $1)`, [id]);
                Parameters.Parameters.sort((a, b) => a.order > b.order).forEach(c => view[c.parameter] = {
                  label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
                  [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null
                });
                config_schema.queryObject = SQLGenegator.QueryObject(view, config_schema.prop);
              }
              model = await db.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
            }
          }
        }
      }
    }
    const result = { view, model, columnDef, prop: config_schema.prop || {} };
    res.json(result);
  } catch (err) { next(err); }
};
router.get('/:type/view', viewAction);
router.get('/:type/view/*/*', viewAction);


// Delete document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async tx => {
      const id = req.params.id;
      let doc = await lib.doc.byId(id, tx);
      const serverDoc = createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await doSubscriptions(doc, 'before detele', tx);
      if (serverDoc && serverDoc.beforeDelete) { serverDoc.beforeDelete(tx); }
      doc = await tx.one(`
        DELETE FROM "Register.Account" WHERE document = $1;
        DELETE FROM "Register.Info" WHERE document = $1;
        DELETE FROM "Register.Accumulation" WHERE document = $1;
        UPDATE "Documents" SET deleted = not deleted, posted = false WHERE id = $1 RETURNING *;`, [id]);
      if (serverDoc && serverDoc.afterDelete) { serverDoc.afterDelete(tx); }
      await doSubscriptions(doc, 'after detele', tx);
      const model = await tx.one(`${configSchema.get(serverDoc.type as any).QueryList} AND d.id = $1`, [id]);
      res.json(model);
    });
  } catch (err) { next(err); }
});

// Upsert document
async function post(doc: INoSqlDocument, serverDoc: DocumentBaseServer, tx: TX) {
  const id = doc.id;
  const isNew = (await tx.oneOrNone('SELECT id FROM "Documents" WHERE id = $1 AND type = $2', [id, doc.type]) === null);
  await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
  if (serverDoc.isDoc) {
    await tx.none(`
    DELETE FROM "Register.Account" WHERE document = $1;
    DELETE FROM "Register.Info" WHERE document = $1;
    DELETE FROM "Register.Accumulation" WHERE document = $1;`, id);
  }
  if (!!doc.posted && serverDoc.beforePost) { await serverDoc.beforePost(tx); }
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
  if (!!doc.posted && serverDoc.onPost) { await InsertRegisterstoDB(doc, await serverDoc.onPost(tx), tx); }
  await doSubscriptions(doc, isNew ? 'after insert' : 'after update', tx);
  return doc;
}

// Upsert document
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async (tx: TX) => {
      const doc: INoSqlDocument = req.body;
      const JDoc = createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await post(doc, JDoc, tx);
      const docServer = await tx.one<DocumentBaseServer>(`${configSchema.get(doc.type as any).QueryObject} AND d.id = $1`, [doc.id]);
      res.json(docServer);
    });
  } catch (err) { next(err); }
});

// unPost by id (without returns posted object to client, for post in cicle many docs)
router.get('/unpost/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async (tx: TX) => await postById(req.params.id, false, tx));
    res.json(true);
  } catch (err) { next(err); }
});

// Post by id (without returns posted object to client, for post in cicle many docs)
router.get('/post/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async (tx: TX) => await postById(req.params.id, true, tx));
    res.json(true);
  } catch (err) { next(err); }
});

// Get raw document by id
router.get('/raw/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await lib.doc.byId(req.params.id, db));
  } catch (err) { next(err); }
});

// Get document viewModel by id
router.get(':type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serverDoc = configSchema.get(req.params.type);
    res.json(await db.one(`${serverDoc.QueryObject} AND d.id = $1`, [req.params.id]));
  } catch (err) { next(err); }
});

router.post('/valueChanges/:type/:property', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = req.body.doc as INoSqlDocument;
    const value = req.body.value as RefValue;
    const property = req.params.property as string;
    const type = req.params.type as DocTypes;
    const serverDoc = createDocumentServer<DocumentBaseServer>(type, doc);

    let result: PatchValue = {};
    if (serverDoc && serverDoc.onValueChanged && typeof serverDoc.onValueChanged === 'function') {
      result = await serverDoc.onValueChanged(property, value, db);
    }
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/command/:type/:command', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result: any = {};
    await db.tx(async (tx: TX) => {
      const doc = createDocumentServer<DocumentBaseServer>(req.params.type, req.body.doc);
      if (doc && doc.onCommand && typeof doc.onCommand === 'function') {
        result = await doc.onCommand(req.params.command, req.body.args, tx);
      }
      res.json(result);
    });
  } catch (err) { next(err); }
});

router.post('/server/:type/:func', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result: any = {};
    await db.tx(async (tx: TX) => {
      const doc = createDocumentServer(req.params.type, req.body.doc);
      const func: (args: any, tx: TX) => Promise<{doc: DocumentBase, result: any}> = doc[req.params.func];
      if (func && typeof func === 'function') { result = await func(req.body.args, tx); }
      res.json(result);
    });
  } catch (err) { next(err); }
});

// Get tree for document list
router.get('/tree/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `select id, description, parent from "Documents" where isfolder and type = $1`;
    res.json(await db.manyOrNone(query, [req.params.type]));
  } catch (err) { next(err); }
});

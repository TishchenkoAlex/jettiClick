import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { PatchValue, RefValue } from '../models/api';
import { DocumentOptions } from '../models/document';
import { createDocumentServer } from '../models/documents.factory.server';
import { DocTypes } from '../models/documents.types';
import { db, TX } from './../db';
import { ColumnDef } from './../models/column';
import { DocumentBaseServer, IServerDocument } from './../models/ServerDocument';
import { FormListSettings } from './../models/user.settings';
import { buildColumnDef } from './../routes/utils/columns-def';
import { lib } from './../std.lib';
import { docOperationResolver, doSubscriptions, InsertRegisterstoDB } from './utils/execute-script';
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
    let config_schema; let view;
    const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
    const JDoc = createDocumentServer(req.params.type as DocTypes);
    view = JDoc.Props();
    config_schema = {
      queryObject: JDoc.QueryObject(),
      queryNewObject: JDoc.QueryNew(),
      settings: ((await db.oneOrNone(`SELECT settings->'${req.params.type}' settings from users where email = '${user}'`)) || {}).settings,
      schemaFull: view,
      prop: JDoc.Prop() as DocumentOptions
    }

    view = config_schema.schemaFull;
    const columnDef: ColumnDef[] = buildColumnDef(view, config_schema.settings || new FormListSettings());

    let model; const id = req.params['0'];
    if (id) {
      if (id === 'new') {
        model = config_schema.queryNewObject ? await db.one(`${config_schema.queryNewObject}`) : {};
      } else {
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
      }
    }
    const result = { view: view, model: model, columnDef: columnDef, prop: config_schema.prop || [] };
    res.json(result);
  } catch (err) { next(err.message); }
})

// Delete document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async tx => {
      const id = req.params.id;
      let doc = await lib.doc.byId(id, tx)
      const documentServer = createDocumentServer(doc.type as DocTypes, doc);
      await doSubscriptions(doc, 'before detele', tx);
      if (documentServer && documentServer.beforeDelete) { documentServer.beforeDelete(tx) }
      doc = await tx.one('UPDATE "Documents" SET deleted = not deleted, posted = false WHERE id = $1 RETURNING *;', [id]);
      if (documentServer && documentServer.afterDelete) { documentServer.afterDelete(tx) }
      await doSubscriptions(doc, 'after detele', tx);
      const model = await tx.one(`${documentServer.QueryObject()} AND d.id = $1`, [id]);
      await docOperationResolver(model, tx);
      res.json(model);
    });
  } catch (err) { next(err.message); }
})

// Upsert document
async function post(doc: IServerDocument, serverDoc: DocumentBaseServer, tx: TX) {
  const id = doc.id;
  const isNew = (await tx.oneOrNone('SELECT id FROM "Documents" WHERE id = $1 AND type = $2', [id, doc.type]) === null);
  await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
  if (serverDoc.isDoc) {
    await tx.none(`
    DELETE FROM "Register.Account" WHERE document = $1;
    DELETE FROM "Register.Info" WHERE document = $1;
    DELETE FROM "Register.Accumulation" WHERE document = $1;`, id);
  }
  if (!!doc.posted && serverDoc.beforePost) { await serverDoc.beforePost(tx) }
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
  if (!!doc.posted && serverDoc.onPost) { await InsertRegisterstoDB(doc, await serverDoc.onPost(tx), tx) }
  await doSubscriptions(doc, isNew ? 'after insert' : 'after update', tx);
}

// Upsert document
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.tx(async (tx: TX) => {
      const doc: IServerDocument = req.body;
      const JDoc = createDocumentServer(doc.type as DocTypes, doc);
      await post(doc, JDoc, tx);
      const docServer = await tx.one<DocumentBaseServer>(`${JDoc.QueryObject()} AND d.id = $1`, [doc.id]);
      await docOperationResolver(docServer, tx);
      res.json(docServer);
    });
  } catch (err) { next(err.message); }
})

// Post by id (without returns posted object to client, for post in cicle many docs)
router.get('/post/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const start = new Date();
    await db.tx(async (tx: TX) => {
      const doc = await lib.doc.byId(req.params.id, tx);
      const JDoc = createDocumentServer(doc.type as DocTypes, doc);
      if (JDoc.isDoc) {
        await tx.none(`
        DELETE FROM "Register.Account" WHERE document = $1;
        DELETE FROM "Register.Info" WHERE document = $1;
        DELETE FROM "Register.Accumulation" WHERE document = $1;
        UPDATE "Documents" d SET posted = not posted WHERE d.id = $1`, doc.id);
      }
      if (!doc.posted && JDoc.onPost) { await InsertRegisterstoDB(doc, await JDoc.onPost(tx), tx) }
    });
    console.log('end', (new Date().getTime() - start.getTime()));
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
    const doc = req.body.doc as IServerDocument;
    const value = req.body.value as RefValue;
    const property = req.params.property as string;
    const type = req.params.type as DocTypes;
    const JDoc = createDocumentServer(type, doc);

    let result: PatchValue = {};
    if (JDoc && JDoc.onValueChanged && typeof JDoc.onValueChanged === 'function') {
      result = await JDoc.onValueChanged(property, value, db);
    }
    res.json(result);
  } catch (err) { next(err.message); }
})

router.post('/command/:type/:command', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result: any = {};
    const doc = createDocumentServer(req.params.type, req.body.doc);
    if (doc && doc.onCommand && typeof doc.onCommand === 'function') { result = await doc.onCommand(req.params.command, req.body.args, db) }
    res.json(result);
  } catch (err) { next(err.message); }
})


router.post('/server/:type/:func', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result: any = {}
    await db.tx(async (tx: TX) => {
      const doc = createDocumentServer(req.params.type, req.body.doc);
      const func = doc[req.params.func];
      if (func && typeof func === 'function') { result = await func(tx, req.body.params, tx) }
      res.json(result);
    })
  } catch (err) { next(err.message); }
})

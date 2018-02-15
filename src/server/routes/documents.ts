import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { DocumentBase, DocumentOptions } from '../../server/models/document';
import { PatchValue, RefValue, calculateDescription } from '../models/api';
import { createDocumentServer } from '../models/documents.factory.server';
import { DocTypes } from '../models/documents.types';
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
import { SQLGenegator } from '../fuctions/SQLGenerator.MSSQL';
import { sdb, MSSQL } from '../mssql';

export const router = express.Router();

// Select documents list for UI (grids/list etc)
router.post('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await List(req, res));
  } catch (err) { next(err); }
});

async function buildOperationViewAndSQL(id: string, view: any, config_schema: any) {
  const Parameters = await sdb.oneOrNone<any>(`
    select JSON_QUERY(doc, '$.Parameters') "Parameters" from "Documents"
    where id = (select JSON_VALUE(doc, '$.Operation') from "Documents" where id = '${id}')`);
  Parameters.Parameters.sort((a, b) => a.order > b.order).forEach(c => view[c.parameter] = {
    label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
    [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null
  });
  config_schema.queryObject = SQLGenegator.QueryObject(view, config_schema.prop);
}

const viewAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let config_schema; let view;
    const user = User(req);
    const serverDoc = configSchema.get(req.params.type);

    view = Object.assign({}, serverDoc.Props);
    config_schema = {
      queryObject: serverDoc.QueryObject,
      queryNewObject: serverDoc.QueryNew,
      settings: (await sdb.oneOrNone<{settings: FormListSettings}>(`
        SELECT JSON_QUERY(settings, '$."${req.params.type}"') settings
        FROM users where email = '${user}'`)).settings as FormListSettings || new FormListSettings(),
      schemaFull: view,
      prop: serverDoc.Prop
    };

    const columnDef = buildColumnDef(view, config_schema.settings);

    let model; const id = req.params['0']; const OperationID = req.params['1'];
    if (id) {
      if (id === 'new') {
        model = config_schema.queryNewObject ? await sdb.oneOrNone<any>(`${config_schema.queryNewObject}`) : {};
      } else {
        if (id.startsWith('copy-')) {
          if (serverDoc.type === 'Document.Operation') { await buildOperationViewAndSQL(id.slice(5), view, config_schema); }
          model = await sdb.oneOrNone<any>(`${config_schema.queryObject} AND d.id = '${id.slice(5)}'`);
          const newDoc = await sdb.oneOrNone<any>(`${config_schema.queryNewObject}`);
          model.id = newDoc.id; model.date = newDoc.date; model.code = newDoc.code;
          model.posted = false; model.deleted = false; model.timestamp = null;
          model.parent = { ...model.parent, id: null, code: null, value: null };
          model.description = 'Copy: ' + model.description;
        } else {
          if (id.startsWith('base-')) {
            const newDoc = createDocumentServer<DocumentBaseServer>(req.params.type);
            model = await newDoc.baseOn(id.slice(5), sdb);
          } else {
            if (id.startsWith('folder-')) {
              model = config_schema.queryNewObject ? await sdb.oneOrNone(`${config_schema.queryNewObject}`) : {};
              const parentDoc = await sdb.oneOrNone<any>(`${config_schema.queryObject} AND d.id = '${id.slice(7)}'`) || {};
              // tslint:disable-next-line:max-line-length
              const parent = { ...model.parent, id: parentDoc.id || null, code: parentDoc.code || null, value: parentDoc.description || null };
              model.parent = parent;
              model.isfolder = true;
            } else {
              if (serverDoc.type === 'Document.Operation') { await buildOperationViewAndSQL(id, view, config_schema); }
              model = await sdb.oneOrNone<any>(`${config_schema.queryObject} AND d.id = '${id}'`);
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
    await sdb.tx(async tx => {
      const id = req.params.id;
      let doc = await lib.doc.byId(id, tx);
      const serverDoc = createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await doSubscriptions(doc, 'before detele', tx);
      if (serverDoc && serverDoc.beforeDelete) { serverDoc.beforeDelete(tx); }
      doc = await tx.none<INoSqlDocument>(`
        DELETE FROM "Register.Account" WHERE document = @p1;
        DELETE FROM "Register.Info" WHERE document = @p1;
        DELETE FROM "Accumulation" WHERE document = @p1;
        UPDATE "Documents" SET deleted = not deleted, posted = false OUTPUT inserted.* WHERE id = @p1;`, [id]);
      if (serverDoc && serverDoc.afterDelete) { await serverDoc.afterDelete(tx); }
      await doSubscriptions(doc, 'after detele', tx);
      const model = await tx.oneOrNone(`${configSchema.get(serverDoc.type as any).QueryObject} AND d.id = @p1`, [id]);
      res.json(model);
    });
  } catch (err) { next(err); }
});

// Upsert document
async function post(doc: INoSqlDocument, serverDoc: DocumentBaseServer, tx: MSSQL) {
  const id = doc.id;
  const isNew = (await tx.oneOrNone<boolean>('SELECT id FROM "Documents" WHERE id = @p1 AND type = @p2', [id, doc.type]) === null);
  await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
  if (serverDoc.isDoc) {
    await tx.none(`
    DELETE FROM "Register.Account" WHERE document = @p1;
    DELETE FROM "Register.Info" WHERE document = @p1;
    DELETE FROM "Accumulation" WHERE document = @p1;`, [id]);
  }
  if (!!doc.posted && serverDoc.beforePost) { await serverDoc.beforePost(tx); }
  const jsonDoc = JSON.stringify(doc);
  if (isNew) {
    doc = await tx.none<INoSqlDocument>(`
      INSERT INTO Documents(
         [id]
        ,[type]
        ,[code]
        ,[description]
        ,[posted]
        ,[deleted]
        ,[doc]
        ,[parent]
        ,[isfolder]
        ,[company]
        ,[user]
        ,[info])
      OUTPUT inserted.*
      SELECT *
      FROM OPENJSON(@p1) WITH (
        [id] UNIQUEIDENTIFIER,
        [type] NVARCHAR(100),
        [code] NVARCHAR(36),
        [description] NVARCHAR(150),
        [posted] BIT,
        [deleted] BIT,
        [doc] NVARCHAR(max) N'$.doc' AS JSON,
        [parent] UNIQUEIDENTIFIER,
        [isfolder] BIT,
        [company] UNIQUEIDENTIFIER,
        [user] UNIQUEIDENTIFIER,
        [info] NVARCHAR(4000)
      )`, [jsonDoc]);
  } else {
    doc = await tx.none<INoSqlDocument>(`
      UPDATE Documents
        SET
          type = i.type, parent = i.parent,
          date = i.date, code = i.code, description = i.description,
          posted = i.posted, deleted = i.deleted, isfolder = i.isfolder,
          "user" = i."user", company = i.company, info = i.info,
          doc = i.doc
        OUTPUT inserted.*
        FROM (
          SELECT *
          FROM OPENJSON(@p1) WITH (
            [id] UNIQUEIDENTIFIER,
            [type] NVARCHAR(100),
            [date] DATE,
            [code] NVARCHAR(36),
            [description] NVARCHAR(150),
            [posted] BIT,
            [deleted] BIT,
            [isfolder] BIT,
            [company] UNIQUEIDENTIFIER,
            [user] UNIQUEIDENTIFIER,
            [info] NVARCHAR(4000),
            [parent] UNIQUEIDENTIFIER,
            [doc] NVARCHAR(max) N'$.doc' AS JSON
          )
        ) i
        WHERE Documents.id = i.id;`, [jsonDoc]);
  }
  if (!!doc.posted && serverDoc.onPost) { await InsertRegisterstoDB(doc, await serverDoc.onPost(tx), tx); }
  await doSubscriptions(doc, isNew ? 'after insert' : 'after update', tx);
  return doc;
}

// Upsert document
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => {
      const doc: INoSqlDocument = req.body;
      const JDoc = createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await post(doc, JDoc, tx);
      const query = `${configSchema.get(doc.type as any).QueryObject} AND d.id = @p1`;
      const docServer = await tx.oneOrNone<DocumentBaseServer>(query, [doc.id]);
      res.json(docServer);
    });
  } catch (err) { next(err); }
});

// unPost by id (without returns posted object to client, for post in cicle many docs)
router.get('/unpost/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => await postById(req.params.id, false, tx));
    res.json(true);
  } catch (err) { next(err); }
});

// Post by id (without returns posted object to client, for post in cicle many docs)
router.get('/post/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => await postById(req.params.id, true, tx));
    res.json(true);
  } catch (err) { next(err); }
});

// Get raw document by id
router.get('/raw/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await lib.doc.byId(req.params.id, sdb));
  } catch (err) { next(err); }
});

// Get document viewModel by id
router.get(':type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serverDoc = configSchema.get(req.params.type);
    res.json(await sdb.oneOrNone(`${serverDoc.QueryObject} AND d.id = '${req.params.id}'`));
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
      result = await serverDoc.onValueChanged(property, value, sdb);
    }
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/command/:type/:command', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result: any = {};
    await sdb.tx(async tx => {
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
    const doc = createDocumentServer(req.params.type, req.body.doc);
    let result = { doc, result: {} };
    await sdb.tx(async tx => {
      const func = (doc[req.params.func] as Function).bind(doc, req.body.params, tx);
      if (func && typeof func === 'function') { result = await func(); }
      res.json(result);
    });
  } catch (err) { next(err); }
});

// Get tree for document list
router.get('/tree/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `select id, description, parent from "Documents" where isfolder and type = '${req.params.type}'`;
    res.json(await sdb.manyOrNone(query));
  } catch (err) { next(err); }
});

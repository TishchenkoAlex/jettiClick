import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { DocumentBase, DocumentOptions, PropOptions } from '../../server/models/document';
import { PatchValue, RefValue, calculateDescription, IViewModel } from '../models/api';
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

const viewAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = req.body as { [key: string]: any };
    const user = User(req);

    let Operation = req.query.Operation;
    if (params.type === 'Document.Operation' && req.query.copy) {
      const sourceRaw = await lib.doc.byId(req.query.copy, sdb);
      Operation = sourceRaw && sourceRaw.doc['Operation'];
    }

    let ServerDoc = params.id ?
      await createDocumentServer<DocumentBaseServer>(params.type, <any>{ id: params.id, type: params.type, Operation }, sdb, true) :
      await createDocumentServer<DocumentBaseServer>(params.type, undefined, sdb, false);

    const schema = Object.assign({}, ServerDoc.Props()) as { [x: string]: PropOptions };
    const metadata = ServerDoc.Prop() as DocumentOptions;
    const settings = (await sdb.oneOrNone<{ settings: FormListSettings }>(`
        SELECT JSON_QUERY(settings, '$."${params.type}"') settings
        FROM users where email = @p1`, [user])).settings as FormListSettings || new FormListSettings();

    const id = params.id as string;
    if (id) {

      const addformControlRefs = async (prm, doc) => {
      for (const k in prm) {
        if (k === 'type' || k === 'id' || k === 'new' || k === 'base' || k === 'copy') { continue; }
        if (typeof params[k] !== 'boolean') doc[k] = await lib.doc.formControlRef(params[k]);
        else doc[k] = params[k];
      }};

      const command = req.query.new ? 'new' : req.query.copy ? 'copy' : req.query.base ? 'base' : '';
      switch (command) {
        case 'new':
          Object.keys(schema).filter(p => schema[p].value !== undefined).forEach(p => ServerDoc[p] = schema[p].value);
          addformControlRefs(params, ServerDoc);
          if (ServerDoc.onCreate) { await ServerDoc.onCreate(sdb); }
          if (req.query.isfolder) ServerDoc.isfolder = true;
          break;
        case 'copy':
          const copyDoc = await createDocumentServer<DocumentBaseServer>
            (params.type, <any>{ id: req.query.copy, type: params.type, Operation }, sdb, true);
          copyDoc.id = id; copyDoc.date = ServerDoc.date; copyDoc.code = ServerDoc.code;
          copyDoc.posted = false; copyDoc.deleted = false; copyDoc.timestamp = null;
          copyDoc.parent = { ...copyDoc.parent, id: null, code: null, value: null };
          copyDoc.description = 'Copy: ' + copyDoc.description;
          ServerDoc = copyDoc;
          addformControlRefs(params, ServerDoc);
          break;
        case 'base':
          await ServerDoc.baseOn(req.query.base, sdb);
          break;
        default:
          break;
      }
    }
    const columnsDef = buildColumnDef(schema, settings);
    const result: IViewModel = { schema, model: ServerDoc, columnsDef, metadata, settings };
    res.json(result);
  } catch (err) { next(err); }
};
router.post('/view', viewAction);

// Delete document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => {
      const id = req.params.id;
      let doc = await lib.doc.byId(id, tx);
      const serverDoc = await createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await doSubscriptions(doc, 'before detele', tx);
      if (serverDoc && serverDoc.beforeDelete) { serverDoc.beforeDelete(tx); }
      doc = await tx.none<INoSqlDocument>(`
        DELETE FROM "Register.Account" WHERE document = '${id}';
        DELETE FROM "Register.Info" WHERE document = '${id}';
        DELETE FROM "Accumulation" WHERE document = '${id}';
        UPDATE "Documents" SET deleted = @p1, posted = 0 OUTPUT deleted.*  WHERE id = '${id}';`, [!!!doc.deleted]);
      if (serverDoc && serverDoc.afterDelete) { await serverDoc.afterDelete(tx); }
      await doSubscriptions(doc, 'after detele', tx);
      const model = await tx.oneOrNone(`${serverDoc['QueryObject']()} AND d.id = '${id}'`);
      res.json(model);
    });
  } catch (err) { next(err); }
});

// Upsert document
async function post(doc: INoSqlDocument, serverDoc: DocumentBaseServer, tx: MSSQL) {
  const id = doc.id;
  const isNew = (await tx.oneOrNone<any>(`SELECT id FROM "Documents" WHERE id = '${id}'`) === null);
  await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
  if (serverDoc.isDoc) {
    await tx.none(`
    DELETE FROM "Register.Account" WHERE document = '${id}';
    DELETE FROM "Register.Info" WHERE document = '${id}';
    DELETE FROM "Accumulation" WHERE document = '${id}';`);
  }
  if (!!doc.posted && serverDoc.beforePost) { await serverDoc.beforePost(tx); }
  doc['time'] = doc.date;
  const jsonDoc = JSON.stringify(doc);
  if (isNew) {
    doc = await tx.none<INoSqlDocument>(`
      INSERT INTO Documents(
         [id]
        ,[type]
        ,[date]
        ,[time]
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
        [date] DATE,
        [time] TIME,
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
          date = i.date, time = i.time, code = i.code, description = i.description,
          posted = i.posted, deleted = i.deleted, isfolder = i.isfolder,
          "user" = i."user", company = i.company, info = i.info, timestamp = GETDATE(),
          doc = i.doc
        OUTPUT inserted.*
        FROM (
          SELECT *
          FROM OPENJSON(@p1) WITH (
            [id] UNIQUEIDENTIFIER,
            [type] NVARCHAR(100),
            [date] DATE,
            [time] TIME,
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
  if (!!doc.posted && serverDoc.onPost && !doc.deleted) { await InsertRegisterstoDB(doc, await serverDoc.onPost(tx), tx); }
  await doSubscriptions(doc, isNew ? 'after insert' : 'after update', tx);
  return doc;
}

// Upsert document
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => {
      const mode: 'post' | 'save' = req.query.mode || 'save';
      const doc: INoSqlDocument = req.body;
      if (mode === 'post') doc.posted = true;
      await addAdditionalToOperation(doc);
      const serverDoc = await createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await post(doc, serverDoc, tx);
      const query = `${serverDoc['QueryObject']()} AND d.id = '${doc.id}'`;
      const docServer = await tx.oneOrNone<DocumentBaseServer>(query);
      res.json(docServer);
    });
  } catch (err) { next(err); }
});

async function addAdditionalToOperation(doc: INoSqlDocument) {
  if (doc.type === 'Document.Operation') {
    const Parameters = await sdb.oneOrNone<any>(`
      select JSON_QUERY(doc, '$.Parameters') "Parameters" from "Documents" where id = @p1`, [doc.doc.Operation]);
    if (Parameters && Parameters.Parameters && Parameters.Parameters.length) {
      let i = 1; Parameters.Parameters
        .sort((a, b) => a.order - b.order)
        .filter(p => p.type.startsWith('Catalog.'))
        .forEach(p => doc.doc[`f${i++}`] = doc.doc[p.parameter]);
    }
  }
}

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

router.post('/valueChanges/:type/:property', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = req.body.doc as INoSqlDocument;
    const value = req.body.value as RefValue;
    const property = req.params.property as string;
    const type = req.params.type as DocTypes;
    const serverDoc = await createDocumentServer<DocumentBaseServer>(type, doc);

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
      const doc = req.body.doc as INoSqlDocument;
      const serverDoc = await createDocumentServer<DocumentBaseServer>(req.params.type, doc);
      if (serverDoc && serverDoc.onCommand && typeof serverDoc.onCommand === 'function') {
        result = await serverDoc.onCommand(req.params.command, req.body.args, tx);
      }
      res.json(result);
    });
  } catch (err) { next(err); }
});

router.post('/server/:type/:func', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = req.body.doc as INoSqlDocument;
    const serverDoc = createDocumentServer(req.params.type, doc);
    let result = { serverDoc, result: {} };
    await sdb.tx(async tx => {
      const func = (serverDoc[req.params.func] as Function).bind(serverDoc, req.body.params, tx);
      if (func && typeof func === 'function') { result = await func(); }
      res.json(result);
    });
  } catch (err) { next(err); }
});

// Get tree for document list
router.get('/tree/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `select id, description, parent from "Documents" where isfolder = 1 and type = @p1`;
    res.json(await sdb.manyOrNone(query, [req.params.type]));
  } catch (err) { next(err); }
});

// Get formControlRef
router.get('/formControlRef/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await lib.doc.formControlRef(req.params.id));
  } catch (err) { next(err); }
});

import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { DocumentBase, DocumentOptions, PropOptions } from '../../server/models/document';
import { PatchValue, RefValue, calculateDescription, IViewModel } from '../models/api';
import { createDocumentServer } from '../models/documents.factory.server';
import { DocTypes } from '../models/documents.types';
import { ColumnDef } from './../models/column';
import { configSchema } from './../models/config';
import { DocumentBaseServer, INoSqlDocument, IFlatDocument } from './../models/ServerDocument';
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
import { RegisterAccumulation } from '../models/Registers/Accumulation/RegisterAccumulation';

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
    const id = params.id as string;

    let Operation = req.query.Operation;
    if (params.type === 'Document.Operation' && req.query.copy) {
      const sourceRaw = await lib.doc.byId(req.query.copy, sdb);
      Operation = sourceRaw && sourceRaw['Operation'];
    }

    let doc: IFlatDocument;
    if (id) doc = await lib.doc.byId(id);
    let ServerDoc = await createDocumentServer<DocumentBaseServer>(params.type, doc, sdb);
    if (!ServerDoc) throw new Error(`wrong type ${params.type}`);

    let model = {};
    const settings = (await sdb.oneOrNone<{ settings: FormListSettings }>(`
        SELECT JSON_QUERY(settings, '$."${params.type}"') settings
        FROM users where email = @p1`, [user])).settings as FormListSettings || new FormListSettings();

    if (id) {

      const addIncomeParamsIntoDoc = async (prm: {[x: string]: any}, d: DocumentBase) => {
        for (const k in prm) {
          if (k === 'type' || k === 'id' || k === 'new' || k === 'base' || k === 'copy') { continue; }
          if (typeof params[k] !== 'boolean') d[k] = params[k]; else d[k] = params[k];
        }
      };

      const command = req.query.new ? 'new' : req.query.copy ? 'copy' : req.query.base ? 'base' : '';
      switch (command) {
        case 'new':
          // init default values from metadata
          const schema = ServerDoc.Props();
          Object.keys(schema).filter(p => schema[p].value !== undefined).forEach(p => ServerDoc[p] = schema[p].value);
          addIncomeParamsIntoDoc(params, ServerDoc);
          if (req.query.isfolder) ServerDoc.isfolder = true;
          if (ServerDoc.onCreate) { await ServerDoc.onCreate(sdb); }
          if (Operation) {
            ServerDoc['Operation'] = Operation;
            ServerDoc = await createDocumentServer<DocumentBaseServer>(params.type, ServerDoc);
          }
          break;
        case 'copy':
          const copy = await lib.doc.byId(req.query.copy);
          const copyDoc = await createDocumentServer<DocumentBaseServer>(params.type, copy!);
          copyDoc.id = id; copyDoc.date = ServerDoc.date; copyDoc.code = ServerDoc.code;
          copyDoc.posted = false; copyDoc.deleted = false; copyDoc.timestamp = null;
          copyDoc.parent = copyDoc.parent;
          copyDoc.description = 'Copy: ' + copyDoc.description;
          ServerDoc.map(copyDoc);
          addIncomeParamsIntoDoc(params, ServerDoc);
          if (Operation) {
            ServerDoc['Operation'] = Operation;
            ServerDoc = await createDocumentServer<DocumentBaseServer>(params.type, ServerDoc);
          }
          break;
        case 'base':
          if (Operation) {
            ServerDoc['Operation'] = Operation;
            ServerDoc = await createDocumentServer<DocumentBaseServer>(params.type, ServerDoc);
          }
          await ServerDoc.baseOn(req.query.base, sdb);
          break;
        default:
          break;
      }
      model = await buildViewModel(ServerDoc);
    }
    const columnsDef = buildColumnDef(ServerDoc.Props(), settings);
    const result: IViewModel = { schema: ServerDoc.Props(), model, columnsDef, metadata: ServerDoc.Prop() as DocumentOptions, settings };
    res.json(result);
  } catch (err) { next(err); }
};
router.post('/view', viewAction);

async function buildViewModel(ServerDoc: DocumentBaseServer) {
  const viewModelQuery = SQLGenegator.QueryObjectFromJSON(ServerDoc.Props(), ServerDoc.Prop() as DocumentOptions);
  const NoSqlDocument = JSON.stringify(lib.doc.noSqlDocument(ServerDoc));
  return await sdb.oneOrNone<{ [key: string]: any }>(viewModelQuery, [NoSqlDocument]);
}

// Delete or UnDelete document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => {
      const id = req.params.id;
      const doc = await lib.doc.byId(id, tx);
      const serverDoc = await createDocumentServer<DocumentBaseServer>(doc!.type as DocTypes, doc!);

      await doSubscriptions(serverDoc, 'before detele', tx);
      if (serverDoc && serverDoc.beforeDelete) { serverDoc.beforeDelete(tx); }

      serverDoc.deleted = !!!serverDoc.deleted;
      serverDoc.posted = false;

      const deleted = await tx.none<INoSqlDocument>(`
        SELECT * FROM "Accumulation" WHERE document = '${id}';
        DELETE FROM "Register.Account" WHERE document = '${id}';
        DELETE FROM "Register.Info" WHERE document = '${id}';
        DELETE FROM "Accumulation" WHERE document = '${id}';
        UPDATE "Documents" SET deleted = @p1, posted = 0 OUTPUT deleted.*  WHERE id = '${id}';`, [serverDoc.deleted]);
      serverDoc['deletedRegisterAccumulation'] = () => deleted;

      if (serverDoc && serverDoc.afterDelete) await serverDoc.afterDelete(tx);
      await doSubscriptions(serverDoc, 'after detele', tx);
      if (serverDoc && serverDoc.onPost) await serverDoc.onPost(tx);

      const view = await buildViewModel(serverDoc);
      res.json(view);
    });
  } catch (err) { next(err); }
});

// Upsert document
async function post(serverDoc: DocumentBaseServer, tx: MSSQL) {
  const id = serverDoc.id;
  const isNew = (await tx.oneOrNone<any>(`SELECT id FROM "Documents" WHERE id = '${id}'`) === null);
  await doSubscriptions(serverDoc, isNew ? 'before insert' : 'before update', tx);
  if (serverDoc.isDoc) {
    const deleted = await tx.none<RegisterAccumulation[]>(`
    SELECT * FROM "Accumulation" WHERE document = '${id}';
    DELETE FROM "Register.Account" WHERE document = '${id}';
    DELETE FROM "Register.Info" WHERE document = '${id}';
    DELETE FROM "Accumulation" WHERE document = '${id}';`);
    serverDoc['deletedRegisterAccumulation'] = () => deleted;
  }
  if (!!serverDoc.posted && serverDoc.beforePost) await serverDoc.beforePost(tx);
  if (!serverDoc.code) serverDoc.code = await lib.doc.docPrefix(serverDoc.type, tx);
  serverDoc.timestamp = new Date();
  const noSqlDocument = lib.doc.noSqlDocument(serverDoc);
  const jsonDoc = JSON.stringify(noSqlDocument);
  let response: INoSqlDocument;
  if (isNew) {
    response = <INoSqlDocument>await tx.none<INoSqlDocument>(`
      INSERT INTO Documents(
         [id]
        ,[type]
        ,[date]
        ,[time]
        ,[code]
        ,[description]
        ,[posted]
        ,[deleted]
        ,[parent]
        ,[isfolder]
        ,[company]
        ,[user]
        ,[info]
        ,[doc])
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
        [parent] UNIQUEIDENTIFIER,
        [isfolder] BIT,
        [company] UNIQUEIDENTIFIER,
        [user] UNIQUEIDENTIFIER,
        [info] NVARCHAR(4000),
        [doc] NVARCHAR(max) N'$.doc' AS JSON
      )`, [jsonDoc]);
  } else {
    response = <INoSqlDocument>await tx.none<INoSqlDocument>(`
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
  serverDoc.map(response);
  if (!!serverDoc.posted && serverDoc.onPost && !serverDoc.deleted) await InsertRegisterstoDB(serverDoc, await serverDoc.onPost(tx), tx);
  await doSubscriptions(serverDoc, isNew ? 'after insert' : 'after update', tx);
  return serverDoc;
}

// Upsert document
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sdb.tx(async tx => {
      const mode: 'post' | 'save' = req.query.mode || 'save';
      const doc: IFlatDocument = req.body;
      if (doc.deleted) throw new Error('cant POST deleted document');
      if (mode === 'post') doc.posted = true;
      await addAdditionalToOperation(doc, tx);
      const serverDoc = await createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
      await post(serverDoc, tx);
      const view = await buildViewModel(serverDoc);
      res.json(view);
    });
  } catch (err) { next(err); }
});

async function addAdditionalToOperation(doc: IFlatDocument, tx) {
  if (doc.type === 'Document.Operation') {
    const Operation = await lib.doc.byId(doc['Operation'], tx);
    const Parameters = (Operation && Operation['Parameters'] || []);
    let i = 1; (Operation && Operation['Parameters'] || [])
      .sort((a, b) => a.order - b.order)
      .filter(p => p.type.startsWith('Catalog.'))
      .forEach(p => doc[`f${i++}`] = doc[p.parameter]);
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
    const doc = req.body.doc as IFlatDocument;
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
      const doc = req.body.doc as IFlatDocument;
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
    const doc = req.body.doc as IFlatDocument;
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

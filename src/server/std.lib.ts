import { db, TX } from './db';
import { RefValue } from './models/api';
import { Ref, DocumentBase } from './models/document';
import { createDocumentServer } from './models/documents.factory.server';
import { DocTypes } from './models/documents.types';
import { RegisterAccumulationTypes } from './models/Registers/Accumulation/factory';
import { DocumentBaseServer, INoSqlDocument } from './models/ServerDocument';
import { InsertRegisterstoDB } from './routes/utils/execute-script';
import { configSchema } from './models/config';

export interface JTL {
  db: TX;
  account: {
    balance: (account: Ref, date: string, company: Ref) => Promise<number>,
    debit: (account: Ref, date: string, company: Ref) => Promise<number>,
    kredit: (account: Ref, date: string, company: Ref) => Promise<number>,
    byCode: (code: string, tx?: TX) => Promise<string>
  };
  register: {
    balance: (type: RegisterAccumulationTypes, date: Date, company: Ref, resource: string[],
      analytics: { [key: string]: Ref }, tx?: TX) => Promise<{ [x: string]: number }>,
    avgCost: (date: Date, company: Ref, analytics: { [key: string]: Ref }, tx?: TX) => Promise<number>,
    inventoryBalance: (date: Date, company: Ref, analytics: { [key: string]: Ref }, tx?: TX) => Promise<number>,
  };
  doc: {
    byCode: (type: DocTypes, code: string, tx?: TX) => Promise<string>;
    byId: (id: string, tx?: TX) => Promise<INoSqlDocument>;
    viewModelById: <T extends DocumentBase>(id: string, tx?: TX) => Promise<T>;
    formControlRef: (id: string, tx?: TX) => Promise<RefValue>;
    postById: (id: string, posted: boolean, tx?: TX) => Promise<void>;
  };
  info: {
    sliceLast: (type: string, date: Date, company: Ref, resource: string,
      analytics: { [key: string]: any }, tx?: TX) => Promise<any>
  };
}

export const lib: JTL = {
  db: db,
  account: {
    balance: balance,
    debit: debit,
    kredit: kredit,
    byCode: accountByCode
  },
  register: {
    balance: registerBalance,
    inventoryBalance: inventoryBalance,
    avgCost: avgCost,
  },
  doc: {
    byCode: byCode,
    byId: byId,
    viewModelById: viewModelById,
    formControlRef: formControlRef,
    postById: postById
  },
  info: {
    sliceLast: sliceLast
  }
};

async function accountByCode(code: string, tx: TX = db) {
  const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = $1`, [code]);
  return result ? result.result as string : null;
}

async function byCode(type: string, code: string, tx: TX = db) {
  const result = await tx.oneOrNone(`SELECT id result FROM "Documents" WHERE type = $1 AND code = $2`, [type, code]);
  return result ? result.result as string : null;
}

async function byId(id: string, tx: TX = db): Promise<INoSqlDocument> {
  const result = await tx.oneOrNone<INoSqlDocument>(`SELECT * FROM "Documents" WHERE id = $1`, [id]);
  return result;
}

async function viewModelById<T extends DocumentBase>(id: string, tx: TX = db): Promise<T> {
  const doc = await byId(id, tx);
  return await tx.one<T>(`${configSchema.get(doc.type).QueryObject} AND d.id = $1`, id);
}

async function formControlRef(id: string, tx: TX = db): Promise<RefValue> {
  const result = await tx.oneOrNone<RefValue>(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = $1`, [id]);
  return result;
}

async function debit(account: Ref, date = new Date().toJSON(), company: Ref): Promise<number> {
  const result = await db.oneOrNone(`
    SELECT SUM(sum)::NUMERIC(15,2) result FROM "Register.Account"
    WHERE dt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
  return result ? result.result : null;
}

async function kredit(account: Ref, date = new Date().toJSON(), company: Ref): Promise<number> {
  const result = await db.oneOrNone(`
    SELECT SUM(sum)::NUMERIC(15,2) result FROM "Register.Account"
    WHERE kt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
  return result ? result.result : null;
}

async function balance(account: Ref, date = new Date().toJSON(), company: Ref): Promise<number> {
  const result = await db.oneOrNone(`
  SELECT (SUM(u.dt) - SUM(u.kt))::NUMERIC(15,2) result  FROM (
      SELECT SUM(sum) dt, 0 kt
      FROM "Register.Account"
      WHERE dt = $1 AND datetime <= $2 AND company = $3

      UNION ALL

      SELECT 0 dt, SUM(sum) kt
      FROM "Register.Account"
      WHERE kt = $1 AND datetime <= $2 AND company = $3
    ) u
    `, [account, date, company]);
  return result ? result.result : null;
}

async function registerBalance(type: RegisterAccumulationTypes, date = new Date(), company: Ref,
  resource: string[], analytics: { [key: string]: Ref }, tx = db): Promise<{ [x: string]: number }> {

  const addQuery = (key) => `SUM((data->>'${key}')::NUMERIC * CASE WHEN kind THEN 1 ELSE -1 END) "${key}",\n`;
  let query = ''; for (const el of resource) { query += addQuery(el); } query = query.slice(0, -2);

  const result = await db.oneOrNone(`
    SELECT ${query}
    FROM "Register.Accumulation"
    WHERE type = $1
      AND date <= $2
      AND company = $3
      AND data @> $4
  `, [type, date, company, analytics]);
  return (result ? result : {});
}

async function avgCost(date = new Date(), company: Ref, analytics: { [key: string]: Ref }, tx = db): Promise<number> {
  const queryText = `
    SELECT
      SUM((data ->> 'Cost')::NUMERIC * CASE WHEN kind THEN 1 ELSE -1 END) /
      NullIf(SUM((data ->> 'Qty')::NUMERIC * CASE WHEN kind THEN 1 ELSE -1 END), 0) result
    FROM "Register.Accumulation"
    WHERE type = 'Register.Accumulation.Inventory'
      AND date <= $1
      AND company = $2
      AND data @> $3`;
  const result = await tx.oneOrNone(queryText, [date, company, analytics]);
  return result ? result.result : null;
}

async function inventoryBalance(date = new Date(), company: Ref, analytics: { [key: string]: Ref }, tx = db): Promise<number> {
  const queryText = `
    SELECT
      SUM((data ->> 'Qty')::NUMERIC * CASE WHEN kind THEN 1 ELSE -1 END) result
    FROM "Register.Accumulation"
    WHERE type = 'Register.Accumulation.Inventory'
      AND date <= $1
      AND company = $2
      AND data @> $3`;
  const result = await tx.oneOrNone(queryText, [date, company, analytics]);
  return result ? result.result : null;
}

async function sliceLast(type: string, date = new Date(), company: Ref,
  resource: string, analytics: { [key: string]: any }, tx = db): Promise<number> {
  const queryText = `
    SELECT data->'${resource}' result FROM "Register.Info"
    WHERE
      type = 'Register.Info.${type}'
      AND date <= $1
      AND company = $2
      AND data @> $3
    ORDER BY date DESC
    LIMIT 1`;
  const result = await tx.oneOrNone(queryText, [date, company, analytics]);
  return result ? result.result : null;
}

export async function postById(id: string, posted: boolean, tx: TX = db) {
  return tx.task(async subtx => {
    const doc = await lib.doc.byId(id, subtx);
    let serverDoc = createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
    if (serverDoc.isDoc) {
      await subtx.none(`
          DELETE FROM "Register.Account" WHERE document = $1;
          DELETE FROM "Register.Info" WHERE document = $1;
          DELETE FROM "Register.Accumulation" WHERE document = $1;
          UPDATE "Documents" d SET posted = $2 WHERE d.id = $1`, [id, posted]);
    }
    if (posted && serverDoc.onPost) { await InsertRegisterstoDB(doc, await serverDoc.onPost(subtx), subtx); }
    serverDoc = undefined;
  });
}

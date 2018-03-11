import { RefValue } from './models/api';
import { Ref, DocumentBase } from './models/document';
import { createDocumentServer } from './models/documents.factory.server';
import { DocTypes } from './models/documents.types';
import { RegisterAccumulationTypes } from './models/Registers/Accumulation/factory';
import { DocumentBaseServer, INoSqlDocument } from './models/ServerDocument';
import { InsertRegisterstoDB } from './routes/utils/execute-script';
import { configSchema } from './models/config';
import { sdb } from './mssql';
import { TX } from './db';

export interface JTL {
  db: TX;
  account: {
    balance: (account: Ref, date: string, company: Ref) => Promise<number>,
    debit: (account: Ref, date: string, company: Ref) => Promise<number>,
    kredit: (account: Ref, date: string, company: Ref) => Promise<number>,
    byCode: (code: string, tx?: TX) => Promise<string>
  };
  register: {
    balance: (type: RegisterAccumulationTypes, date: Date, resource: string[],
      analytics: { [key: string]: Ref }, tx?: TX) => Promise<{ [x: string]: number }>,
    avgCost: (date: Date, analytics: { [key: string]: Ref }, tx?: TX) => Promise<number>,
    inventoryBalance: (date: Date, analytics: { [key: string]: Ref }, tx?: TX) => Promise<{ Cost: number, Qty: number }>,
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
  db: sdb,
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

async function accountByCode(code: string, tx: TX = sdb) {
  const result = await tx.oneOrNone<any>(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = @p1`, [code]);
  return result ? result.result as string : null;
}

async function byCode(type: string, code: string, tx: TX = sdb) {
  const result = await tx.oneOrNone<any>(`SELECT id result FROM "Documents" WHERE type = @p1 AND code = @p2`, [type, code]);
  return result ? result.result as string : null;
}

async function byId(id: string, tx: TX = sdb): Promise<INoSqlDocument> {
  const result = await tx.oneOrNone<INoSqlDocument>(`
  SELECT id, type, parent, date, code, description, posted, deleted, isfolder, company, [user], info, timestamp,
  JSON_QUERY(doc) doc from Documents WHERE id = @p1`, [id]);
  return result;
}

async function viewModelById<T extends DocumentBase>(id: string, tx: TX = sdb): Promise<T> {
  const doc = await byId(id, tx);
  return await tx.oneOrNone<T>(`${configSchema.get(doc.type).QueryObject} AND d.id = @p1`, [id]);
}

async function formControlRef(id: string, tx: TX = sdb): Promise<RefValue> {
  const result = await tx.oneOrNone<RefValue>(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = @p1`, [id]);
  return result;
}

async function debit(account: Ref, date = new Date().toJSON(), company: Ref): Promise<number> {
  const result = await sdb.oneOrNone<any>(`
    SELECT SUM(sum) result FROM "Register.Account"
    WHERE dt = @p1 AND datetime <= @p2 AND company = @p3`, [account, date, company]);
  return result ? result.result : null;
}

async function kredit(account: Ref, date = new Date().toJSON(), company: Ref): Promise<number> {
  const result = await sdb.oneOrNone<any>(`
    SELECT SUM(sum) result FROM "Register.Account"
    WHERE kt = @p1 AND datetime <= @p2 AND company = @p3`, [account, date, company]);
  return result ? result.result : null;
}

async function balance(account: Ref, date = new Date().toJSON(), company: Ref): Promise<number> {
  const result = await sdb.oneOrNone<any>(`
  SELECT (SUM(u.dt) - SUM(u.kt)) result  FROM (
      SELECT SUM(sum) dt, 0 kt
      FROM "Register.Account"
      WHERE dt = @p1 AND datetime <= @p2 AND company = @p3

      UNION ALL

      SELECT 0 dt, SUM(sum) kt
      FROM "Register.Account"
      WHERE kt = @p1 AND datetime <= @p2 AND company = @p3
    ) u
    `, [account, date, company]);
  return result ? result.result : null;
}

async function registerBalance(type: RegisterAccumulationTypes, date = new Date(),
  resource: string[], analytics: { [key: string]: Ref }, tx = sdb): Promise<{ [x: string]: number }> {

  const addFields = (key) => `SUM("${key}") "${key}",\n`;
  let fields = ''; for (const el of resource) { fields += addFields(el); } fields = fields.slice(0, -2);

  const addWhere = (key) => `AND "${key}" = '${analytics[key]}'\n`;
  let where = ''; for (const el of resource) { where += addWhere(el); } where = where.slice(0, -2);

  const queryText = `
  SELECT ${fields}
  FROM "${type}"
  WHERE (1=1)
    AND date <= @p1
    ${where}
  `;

  const result = await sdb.oneOrNone<any>(queryText, [date]);
  return (result ? result : {});
}

async function avgCost(date, analytics: { [key: string]: Ref }, tx = sdb): Promise<number> {
  const queryText = `
  SELECT
    SUM("Cost") / NULLIF(SUM("Qty"), 0) result
  FROM "Register.Accumulation.Inventory"
  WHERE (1=1)
    AND date <= @p1
    AND company = @p2
    AND "SKU" = @p3
    AND "Storehouse" = @p4`;
  const result = await tx.oneOrNone<any>(queryText, [date, analytics.company, analytics.SKU, analytics.Storehouse]);
  return result ? result.result : null;
}

async function inventoryBalance(date, analytics: { [key: string]: Ref }, tx = sdb): Promise<{ Cost: number, Qty: number }> {
  const queryText = `
  SELECT
    SUM("Cost") "Cost", SUM("Qty") "Qty"
    FROM "Register.Accumulation.Inventory"
    WHERE (1=1)
      AND date <= @p1
      AND company = @p2
      AND "SKU" = @p3
      AND "Storehouse" = @p4`;
  const result = await tx.oneOrNone<any>(queryText, [date, analytics.company, analytics.SKU, analytics.Storehouse]);
  return result ? { Cost: result.Cost, Qty: result.Qty } : null;
}

async function sliceLast(type: string, date = new Date(), company: Ref,
  resource: string, analytics: { [key: string]: any }, tx = sdb): Promise<number> {

  const addWhere = (key) => `NEAR((${key}, ${analytics[key]}),1) AND `;
  let where = ''; for (const el of resource) { where += addWhere(el); } where = where.slice(0, -4);

  const queryText = `
    SELECT TOP 1 JSON_VALUE(data, '$.${resource}') result FROM "Register.Info"
    WHERE (1=1)
      AND date <= @p1
      AND type = '${type}'
      AND company = '${company}'
      AND CONTAINS(data, '${where}')
    ORDER BY date DESC`;
  const result = await tx.oneOrNone<any>(queryText, [date]);
  return result ? result.result : null;
}

export async function postById(id: string, posted: boolean, tx: TX = sdb) {
  return tx.tx<any>(async subtx => {
    const doc = await lib.doc.byId(id, subtx);
    let serverDoc = createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
    if (serverDoc.isDoc) {
      await subtx.none(`
        DELETE FROM "Register.Account" WHERE document = @p1;
        DELETE FROM "Register.Info" WHERE document = @p1;
        DELETE FROM "Accumulation" WHERE document = @p1;
        UPDATE "Documents" SET posted = @p2 WHERE id = @p1`, [id, posted ? 1 : 0]);
    }
    if (posted && serverDoc.onPost) { await InsertRegisterstoDB(doc, await serverDoc.onPost(subtx), subtx); }
    serverDoc = undefined;
  });
}

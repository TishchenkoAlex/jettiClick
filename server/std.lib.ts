import { TX } from './db';
import { RefValue } from './models/api';
import { configSchema } from './models/config';
import { DocumentBase, Ref } from './models/document';
import { createDocumentServer } from './models/documents.factory.server';
import { DocTypes } from './models/documents.types';
import { RegisterAccumulationTypes } from './models/Registers/Accumulation/factory';
import { DocumentBaseServer, INoSqlDocument } from './models/ServerDocument';
import { sdb, MSSQL } from './mssql';
import { InsertRegisterstoDB } from './routes/utils/execute-script';
import { RegisterAccumulation } from './models/Registers/Accumulation/RegisterAccumulation';

export interface BatchRow {
  SKU: Ref; Storehouse: Ref; Qty: number; batch: Ref; Cost: number;
  res1: number; res2: number; res3: number; res4: number; res5: number;
}

export interface JTL {
  db: TX;
  account: {
    balance: (account: Ref, date: string, company: Ref) => Promise<number>,
    debit: (account: Ref, date: string, company: Ref) => Promise<number>,
    kredit: (account: Ref, date: string, company: Ref) => Promise<number>,
    byCode: (code: string, tx?: TX) => Promise<string>
  };
  register: {
    movementsByDoc: <T extends RegisterAccumulation>(type: RegisterAccumulationTypes, doc: Ref, tx?: TX) => Promise<T[]>,
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
    noSqlDocument: (flatDoc: { [x: string]: any }) => INoSqlDocument
  };
  info: {
    sliceLast: (type: string, date: Date, company: Ref, resource: string,
      analytics: { [key: string]: any }, tx?: TX) => Promise<any>
  };
  inventory: {
    batch: (date: Date, company: Ref, rows: BatchRow[], tx?: TX) => Promise<BatchRow[]>
  };
}

export const lib: JTL = {
  db: sdb,
  account: {
    balance,
    debit,
    kredit,
    byCode: accountByCode
  },
  register: {
    balance: registerBalance,
    inventoryBalance,
    avgCost,
    movementsByDoc,
  },
  doc: {
    byCode: byCode,
    byId: byId,
    viewModelById,
    formControlRef,
    postById,
    noSqlDocument
  },
  info: {
    sliceLast: sliceLast
  },
  inventory: {
    batch: batch
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
  JSON_QUERY(doc) doc from Documents WHERE id = '${id}'`);
  const { doc, ...header } = result;
  const flatDoc = { ...header, ...doc };
  return result;
}

function noSqlDocument(flatDoc: { [x: string]: any }): INoSqlDocument {
  const { id, date, type, code, description, company, user, posted, deleted, isfolder, parent, info, timestamp, ...doc } = flatDoc;
  return { id, date, type, code, description, company, user, posted, deleted, isfolder, parent, info, timestamp, doc };
}

async function viewModelById<T extends DocumentBase>(id: string, tx: TX = sdb): Promise<T> {
  const doc = await byId(id, tx);
  return await tx.oneOrNone<T>(`${configSchema.get(doc.type).QueryObject} AND d.id = '${id}'`);
}

async function formControlRef(id: string, tx: TX = sdb): Promise<RefValue> {
  const result = await tx.oneOrNone<RefValue>(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = '${id}'`);
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
    SUM("Cost.In") / NULLIF(SUM("Qty.In"), 1) result
  FROM "Register.Accumulation.Inventory"
  WHERE (1=1)
    AND kind = 1
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
  let where = ''; for (const el of Object.keys(analytics)) { where += addWhere(el); } where = where.slice(0, -4);

  const queryText = `
    SELECT TOP 1 JSON_VALUE(data, '$.${resource}') result FROM "Register.Info"
    WHERE (1=1)
      AND date <= @p1
      AND type = 'Register.Info.${type}'
      AND company = '${company}'
      AND CONTAINS(data, '${where}')
    ORDER BY date DESC`;
  const result = await tx.oneOrNone<any>(queryText, [date]);
  return result ? result.result : null;
}

export async function postById(id: string, posted: boolean, tx: TX = sdb) {
  return tx.tx<any>(async subtx => {
    const doc = await lib.doc.byId(id, subtx);
    let serverDoc = await createDocumentServer<DocumentBaseServer>(doc.type as DocTypes, doc);
    if (serverDoc.isDoc) {
      await subtx.none(`
        DELETE FROM "Register.Account" WHERE document = '${id}';
        DELETE FROM "Register.Info" WHERE document = '${id}';
        DELETE FROM "Accumulation" WHERE document = '${id}';
        UPDATE "Documents" SET posted = ${posted ? 1 : 0} WHERE id = '${id}'`);
    }
    if (posted && serverDoc.onPost && !doc.deleted) { await InsertRegisterstoDB(doc, await serverDoc.onPost(subtx), subtx); }
    serverDoc = undefined;
  });
}

export async function movementsByDoc<T extends RegisterAccumulation>(type: RegisterAccumulationTypes, doc: Ref, tx: TX = sdb) {
  const queryText = `
  SELECT kind, date, type, company, document, JSON_QUERY(data) data
  FROM Accumulation where type = '${type}' AND document = '${doc}'`;
  return await tx.manyOrNone<T>(queryText);
}

export async function batch(date: Date, company: Ref, rows: BatchRow[], tx: TX = sdb) {
  const rowsKeys = rows.map(r => (r.Storehouse as string) + (r.SKU as string));
  const uniquerowsKeys = rowsKeys.filter((v, i, a) => a.indexOf(v) === i);
  const grouped = uniquerowsKeys.map(r => {
    const filter = rows.filter(f => (f.Storehouse as string) + (f.SKU as string) === r);
    const Qty = filter.reduce((a, b) => a + b.Qty, 0);
    const res1 = filter.reduce((a, b) => a + b.res1, 0);
    const res2 = filter.reduce((a, b) => a + b.res2, 0);
    const res3 = filter.reduce((a, b) => a + b.res3, 0);
    const res4 = filter.reduce((a, b) => a + b.res4, 0);
    const res5 = filter.reduce((a, b) => a + b.res5, 0);
    return <BatchRow>({ SKU: filter[0].SKU, Storehouse: filter[0].Storehouse, Qty, Cost: 0, batch: null, res1, res2, res3 });
  });
  const result: BatchRow[] = [];
  for (const row of grouped) {
    const queryText = `
      SELECT batch, Qty, Cost, b.date FROM (
      SELECT
        batch,
        SUM("Qty") Qty,
        SUM("Cost.In") / NULLIF(SUM("Qty.In"), 1) Cost
      FROM "Register.Accumulation.Inventory" r
      WHERE (1=1)
        AND date <= @p1
        AND company = @p2
        AND "SKU" = @p3
        AND "Storehouse" = @p4
      GROUP BY batch
      HAVING SUM("Qty") > 0 ) s
      LEFT JOIN Documents b ON b.id = s.batch
      ORDER BY b.date, s.batch`;
    const queryResult = await tx.manyOrNone<{ batch: string, Qty: number, Cost: number }>
      (queryText, [date, company, row.SKU, row.Storehouse]);
    let total = row.Qty;
    for (const a of queryResult) {
      if (total <= 0) break;
      const q = Math.min(total, a.Qty);
      const rate = q / row.Qty;
      result.push({
        batch: a.batch, Qty: q, Cost: a.Cost * q, Storehouse: row.Storehouse, SKU: row.SKU,
        res1: row.res1 * rate, res2: row.res2 * rate, res3: row.res3 * rate, res4: row.res3 * rate, res5: row.res3 * rate
      });
      total = total - q;
    }
    if (total > 0) {
      const SKU = await lib.doc.byId(row.SKU as string, tx);
      throw new Error(`Не достаточно ${total} единиц ${SKU.description}`);
    }
  }
  return result;
}

import { db } from './db';
import { IDocBase, Ref, RefValue, TX } from './modules/doc.base';

export interface JTL {
  account: {
    balance: (account: Ref, date: string, company: Ref) => Promise<number>,
    debit: (account: Ref, date: string, company: Ref) => Promise<number>,
    kredit: (account: Ref, date: string, company: Ref) => Promise<number>,
    byCode: (code: string, tx?: TX) => Promise<string>
  },
  register: {
    balance: (type: string, date: string, company: Ref, resource: string[],
      analytics: { [key: string]: Ref }, tx?: TX) => Promise<any>,
    avgCost: (date: string, company: Ref, analytics: { [key: string]: Ref }, tx?: TX) => Promise<number>
  }
  doc: {
    byCode: (type: string, code: string, tx?: TX) => Promise<Ref>;
    byId: <T extends IDocBase>(id: string, tx?: TX) => Promise<T>;
    modelById: (id: string, tx?: TX) => Promise<IDocBase>;
    formControlRef: (id: string, tx?: TX) => Promise<RefValue>;
  },
  info: {
    sliceLast: (type: string, date: string, company: Ref, resource: string,
      analytics: { [key: string]: any }, tx?: TX) => Promise<any>
  }
}

export const lib: JTL = {
  account: {
    balance: balance,
    debit: debit,
    kredit: kredit,
    byCode: accountByCode
  },
  register: {
    balance: registerBalance,
    avgCost: avgCost
  },
  doc: {
    byCode: byCode,
    byId: byId,
    modelById: modelById,
    formControlRef: formControlRef
  },
  info: {
    sliceLast: sliceLast
  }
}

async function accountByCode(code: string, tx: TX = db) {
  const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = $1`, [code]);
  return result.result as Ref;
}

async function byCode(type: string, code: string, tx: TX = db) {
  const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = $1 AND code = $2`, [type, code]);
  return result.result as Ref;
}

async function byId<T>(id: string, tx: TX = db) {
  return await tx.oneOrNone<T>(`SELECT * FROM "Documents" WHERE id = $1`, [id]);
}

async function modelById(id: string, tx: TX = db) {
  const doc = await byId<IDocBase>(id, tx);
  const config_schema = await tx.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
  const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, id);
  return model as IDocBase;
}

async function formControlRef(id: string, tx: TX = db) {
  const result = await tx.oneOrNone(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = $1`, [id]);
  return result as RefValue;
}

async function debit(account: Ref, date = new Date().toJSON(), company: Ref) {
  const result = await db.oneOrNone(`
    SELECT SUM(sum)::NUMERIC(15,2) result FROM "Register.Account"
    WHERE dt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
  return result.result as number;
}

async function kredit(account: Ref, date = new Date().toJSON(), company: Ref) {
  const result = await db.oneOrNone(`
    SELECT SUM(sum)::NUMERIC(15,2) result FROM "Register.Account"
    WHERE kt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
  return result.result as number;
}

async function balance(account: Ref, date = new Date().toJSON(), company: Ref) {
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
  return result.result as number;
}

async function registerBalance(type: string, date = new Date().toJSON(), company: Ref,
  resource: string[], analytics: { [key: string]: Ref }, tx = db) {

  const addQuery = (key) => `SUM((data->>'${key}') :: NUMERIC(15, 2) * CASE WHEN kind THEN 1 ELSE -1 END) "${key}",\n`
  let query = ''; for (const el of resource) { query += addQuery(el) };

  const result = await db.oneOrNone(`
      SELECT ${query.slice(2)}
      FROM "Register.Accumulation"
      WHERE type = $1
        AND date <= $2
        AND company = $3
        AND data @> $4
    `, [type, date, company, analytics]);
  return (result ? result : {});
}

async function avgCost(date = new Date().toJSON(), company: Ref, analytics: { [key: string]: Ref }, tx = db) {
  const queryText = `
    SELECT
      SUM((data ->> 'Cost')::NUMERIC(15, 2) * CASE WHEN kind THEN 1 ELSE -1 END) /
      SUM((data ->> 'Qty')::NUMERIC(15, 2)  * CASE WHEN kind THEN 1 ELSE -1 END) result
    FROM "Register.Accumulation"
    WHERE type = 'Register.Accumulation.Inventory'
      AND date <= $1
      AND company = $2
      AND data @> $3
    `;
  const result = await tx.oneOrNone(queryText, [date, company, analytics]);
  return result.result as number;
}

async function sliceLast(type: string, date = new Date().toJSON(), company: Ref,
  resource: string, analytics: { [key: string]: any }, tx = db) {
  const queryText = `
    SELECT data->'${resource}' result FROM "Register.Info"
    WHERE
      type = '${type}'
      AND date <= $1
      AND company = $2
      AND data @> $3
    ORDER BY date DESC
    LIMIT 1
  `;
  const result = await tx.oneOrNone(queryText, [date, company, analytics]);
  return result.result;
}

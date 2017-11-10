import { IDatabase, ITask } from 'pg-promise';

import { db } from './db';
import { IDocBase, Ref, RefValue } from './modules/doc.base';

export interface JTL {
  account: {
    balance: (account: Ref, date: string, company: string) => Promise<number>,
    debit: (account: Ref, date: string, company: string) => Promise<number>,
    kredit: (account: Ref, date: string, company: string) => Promise<number>,
    byCode: (code: string, tx?: ITask<any> | IDatabase<any>) => Promise<string>
  },
  register: {
    balance: (type: string, date: string, company: string, resource: string, analytics: {[key: string]: Ref}) => Promise<number>,
    avgCost: (date: string, company: string, analytics: {[key: string]: Ref}, tx?: ITask<any> | IDatabase<any>) => Promise<number>
  }
  doc: {
    byCode: (type: string, code: string, tx?: ITask<any> | IDatabase<any>) => Promise<string>;
    byId: (id: string, tx?: ITask<any> | IDatabase<any>) => Promise<IDocBase>;
    modelById: (id: string, tx?: ITask<any> | IDatabase<any>) => Promise<IDocBase>;
    formControlRef: (id: string, tx?: ITask<any> | IDatabase<any>) => Promise<RefValue>;
  },
  info: {
    sliceLast: (type: string, date: string, company: string, resource: string,
      analytics: {[key: string]: any}, tx?: ITask<any> | IDatabase<any>) => Promise<any>
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

async function accountByCode(code: string, tx: ITask<any> | IDatabase<any> = db) {
  const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = $1`, [code]);
  return result.result as Ref;
}

async function byCode(type: string, code: string, tx: ITask<any> | IDatabase<any> = db) {
  const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = $1 AND code = $2`, [type, code]);
  return result.result as Ref;
}

async function byId(id: string, tx: ITask<any> | IDatabase<any> = db) {
  const result = await tx.oneOrNone(`SELECT * FROM "Documents" WHERE id = $1`, [id]);
  return result as IDocBase;
}

async function modelById(id: string, tx: ITask<any> | IDatabase<any> = db) {
  const doc = await byId(id, tx);
  const config_schema = await tx.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
  const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, id);
  return model as IDocBase;
}

async function formControlRef(id: string, tx: ITask<any> | IDatabase<any> = db) {
  const result = await tx.oneOrNone(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = $1`, [id]);
  return result as RefValue;
}

async function debit(account: Ref, date = new Date().toJSON(), company: string) {
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

async function balance(account: Ref, date = new Date().toJSON(), company: string) {
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

async function registerBalance(type: string, date = new Date().toJSON(), company: string,
  resource: string, analytics: {[key: string]: Ref}) {
  const result = await db.oneOrNone(`
  SELECT SUM(q."in" - q."out") result FROM (
      SELECT
        SUM((data->>'${resource}') :: NUMERIC(15, 2)) "in", 0 "out"
      FROM "Register.Accumulation" r1
      WHERE type = $1
        AND kind = TRUE
        AND date <= $2
        AND company = $3
        AND data @> $4

      UNION ALL

      SELECT 0 "in", SUM((data->>'${resource}'):: NUMERIC (15, 2)) "out"
      FROM "Register.Accumulation" r1
      WHERE type = $1
        AND kind = FALSE
        AND date <= $2
        AND company = $3
        AND DATA @> $4
    ) q
    `, [type, date, company, analytics]);
  return result.result as number;
}

async function avgCost(date = new Date().toJSON(), company: string, analytics: {[key: string]: Ref}, tx = db) {
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

async function sliceLast(type: string, date = new Date().toJSON(), company: string,
  resource: string, analytics: {[key: string]: any}, tx = db) {
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

import { db } from './db';
import { DocBase, Ref, RefValue } from './modules/doc.base';

export interface JTL {
  account: {
    balance: (account: Ref, date: string, company: string) => Promise<number>,
    debit: (account: Ref, date: string, company: string) => Promise<number>,
    kredit: (account: Ref, date: string, company: string) => Promise<number>,
    byCode: (code: string) => Promise<string>
  },
  doc: {
    byCode: (type: string, code: string) => Promise<string>;
    byId: (id: string) => Promise<DocBase>;
    modelById: (id: string) => Promise<DocBase>;
    formControlRef: (id: string) => Promise<RefValue>;
  }
}

export const lib: JTL = {
  account: {
    balance: balance,
    debit: debit,
    kredit: kredit,
    byCode: accountByCode
  },
  doc: {
    byCode: byCode,
    byId: byId,
    modelById: modelById,
    formControlRef: formControlRef
  }
}

async function accountByCode(code: string) {
  const result = await db.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = $1`, [code]);
  return result.result as Ref;
}

async function byCode(type: string, code: string) {
  const result = await db.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = $1 AND code = $2`, [type, code]);
  return result.result as Ref;
}

async function byId(id: string) {
  const result = await db.oneOrNone(`SELECT * FROM "Documents" WHERE id = $1`, [id]);
  return result as DocBase;
}

async function modelById(id: string) {
  const doc = await byId(id);
  const config_schema = await db.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
  const model = await db.one(`${config_schema.queryObject} AND d.id = $1`, id);
  return model as DocBase;
}

async function formControlRef(id: string) {
  const result = await db.oneOrNone(`
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

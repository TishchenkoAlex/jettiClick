import { db } from './db';
import { DocBase, RefValue, Ref } from './modules/doc.base';

export const lib = {
  account: {
    balance: balance,
    debit: debit,
    kredit: kredit,
    byCode: accountByCode
  },
  doc: {
    byCode: byCode,
    byId: byId,
    formControlRef: formControlRef
  }
}

async function accountByCode(code) {
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

async function formControlRef(id: string) {
  const result = await db.oneOrNone(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = $1`, [id]);
  return result as RefValue;
}

async function debit(account: Ref, date = new Date().toJSON(), company: string) {
  const result = await db.one(`
    SELECT SUM(sum) result FROM "Register.Account" a
    JOIN "Documents" da ON da.code = a.dt and da.type = 'Catalog.Account'
    JOIN "Documents" dc ON dc.id = a.company and dc.type = 'Catalog.Company'
    WHERE da.code = $1 AND a.datetime <= $2 AND dc.code = $3`, [account, date, company]);
  return result.result as number;
}

async function kredit(account: Ref, date = new Date().toJSON(), company: string) {
  const result = await db.one(`
    SELECT SUM(sum) result FROM "Register.Account" a
    JOIN "Documents" da ON da.code = a.kt and da.type = 'Catalog.Account'
    WHERE da.code = $1 AND a.datetime <= $2`, [account, date]);
  return result.result as number;
}

async function balance(account: Ref, date = new Date().toJSON(), company: string) {
  const result = await db.one(`
    SELECT SUM(sum) result FROM "Register.Account"
    WHERE dt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
  return result.result as number;
}

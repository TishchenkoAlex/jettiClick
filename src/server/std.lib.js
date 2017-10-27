"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
exports.lib = {
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
};
async function accountByCode(code) {
    const result = await db_1.db.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = $1`, [code]);
    return result.result;
}
async function byCode(type, code) {
    const result = await db_1.db.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = $1 AND code = $2`, [type, code]);
    return result.result;
}
async function byId(id) {
    const result = await db_1.db.oneOrNone(`SELECT * FROM "Documents" WHERE id = $1`, [id]);
    return result;
}
async function modelById(id) {
    const doc = await byId(id);
    const config_schema = await db_1.db.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
    const model = await db_1.db.one(`${config_schema.queryObject} AND d.id = $1`, id);
    return model;
}
async function formControlRef(id) {
    const result = await db_1.db.oneOrNone(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = $1`, [id]);
    return result;
}
async function debit(account, date = new Date().toJSON(), company) {
    const result = await db_1.db.oneOrNone(`
    SELECT SUM(sum)::NUMERIC(15,2) result FROM "Register.Account"
    WHERE dt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
    return result.result;
}
async function kredit(account, date = new Date().toJSON(), company) {
    const result = await db_1.db.oneOrNone(`
    SELECT SUM(sum)::NUMERIC(15,2) result FROM "Register.Account"
    WHERE kt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
    return result.result;
}
async function balance(account, date = new Date().toJSON(), company) {
    const result = await db_1.db.oneOrNone(`
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
    return result.result;
}
//# sourceMappingURL=std.lib.js.map
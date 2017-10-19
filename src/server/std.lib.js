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
async function formControlRef(id) {
    const result = await db_1.db.oneOrNone(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = $1`, [id]);
    return result;
}
async function debit(company, account, date) {
    const result = await db_1.db.one(`
    SELECT SUM(sum) result FROM "Register.Account" a
    JOIN "Documents" da ON da.code = a.dt and da.type = 'Catalog.Account'
    JOIN "Documents" dc ON dc.id = a.company and dc.type = 'Catalog.Company'
    WHERE da.code = $1 AND a.datetime <= $2 AND dc.code = $3`, [account, date, company]);
    return result.result;
}
async function kredit(account, date) {
    const result = await db_1.db.one(`
    SELECT SUM(sum) result FROM "Register.Account" a
    JOIN "Documents" da ON da.code = a.kt and da.type = 'Catalog.Account'
    WHERE da.code = $1 AND a.datetime <= $2`, [account, date]);
    return result.result;
}
async function balance(account, date = new Date(), company) {
    const result = await db_1.db.one(`
    SELECT SUM(sum) result FROM "Register.Account"
    WHERE dt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
    return result.result;
}
//# sourceMappingURL=std.lib.js.map
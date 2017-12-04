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
};
async function accountByCode(code, tx = db_1.db) {
    const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = $1`, [code]);
    return (result ? result.result : null);
}
async function byCode(type, code, tx = db_1.db) {
    const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = $1 AND code = $2`, [type, code]);
    return (result ? result.result : null);
}
async function byId(id, tx = db_1.db) {
    const result = await tx.oneOrNone(`SELECT * FROM "Documents" WHERE id = $1`, [id]);
    return result;
}
async function modelById(id, tx = db_1.db) {
    const doc = await byId(id, tx);
    const config_schema = await tx.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
    const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, id);
    return model;
}
async function formControlRef(id, tx = db_1.db) {
    const result = await tx.oneOrNone(`
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
async function registerBalance(type, date = new Date().toJSON(), company, resource, analytics, tx = db_1.db) {
    const addQuery = (key) => `SUM((data->>'${key}') :: NUMERIC(15, 2) * CASE WHEN kind THEN 1 ELSE -1 END) "${key}",\n`;
    let query = '';
    for (const el of resource) {
        query += addQuery(el);
    }
    ;
    const result = await db_1.db.oneOrNone(`
      SELECT ${query.slice(2)}
      FROM "Register.Accumulation"
      WHERE type = $1
        AND date <= $2
        AND company = $3
        AND data @> $4
    `, [type, date, company, analytics]);
    return (result ? result : {});
}
async function avgCost(date = new Date().toJSON(), company, analytics, tx = db_1.db) {
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
    return result.result;
}
async function InventoryBalance(date = new Date().toJSON(), company, analytics, tx = db_1.db) {
    const queryText = `
    SELECT
      SUM((data ->> 'Qty')::NUMERIC(15, 2)  * CASE WHEN kind THEN 1 ELSE -1 END) result
    FROM "Register.Accumulation"
    WHERE type = 'Register.Accumulation.Inventory'
      AND date <= $1
      AND company = $2
      AND data @> $3
    `;
    const result = await tx.oneOrNone(queryText, [date, company, analytics]);
    return result ? result.result : null;
}
async function sliceLast(type, date = new Date().toJSON(), company, resource, analytics, tx = db_1.db) {
    const queryText = `
    SELECT data->'${resource}' result FROM "Register.Info"
    WHERE
      type = 'Register.Info.${type}'
      AND date <= $1
      AND company = $2
      AND data @> $3
    ORDER BY date DESC
    LIMIT 1
  `;
    const result = await tx.oneOrNone(queryText, [date, company, analytics]);
    return result ? result.result : null;
}
//# sourceMappingURL=std.lib.js.map
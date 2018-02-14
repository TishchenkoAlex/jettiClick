"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documents_factory_server_1 = require("./models/documents.factory.server");
const execute_script_1 = require("./routes/utils/execute-script");
const config_1 = require("./models/config");
const mssql_1 = require("./mssql");
exports.lib = {
    db: mssql_1.sdb,
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
async function accountByCode(code, tx = mssql_1.sdb) {
    const result = await tx.oneOrNone(`
    SELECT id result FROM "Documents" WHERE type = 'Catalog.Account' AND code = @p1`, [code]);
    return result ? result.result : null;
}
async function byCode(type, code, tx = mssql_1.sdb) {
    const result = await tx.oneOrNone(`SELECT id result FROM "Documents" WHERE type = @p1 AND code = @p2`, [type, code]);
    return result ? result.result : null;
}
async function byId(id, tx = mssql_1.sdb) {
    const result = await tx.oneOrNone(`
  SELECT id, type, parent, date, code, description, posted, deleted, isfolder, company, [user], info, timestamp,
  JSON_QUERY(doc) doc from Documents WHERE id = '${id}'`);
    return result;
}
async function viewModelById(id, tx = mssql_1.sdb) {
    const doc = await byId(id, tx);
    return await tx.oneOrNone(`${config_1.configSchema.get(doc.type).QueryObject} AND d.id = @p1`, [id]);
}
async function formControlRef(id, tx = mssql_1.sdb) {
    const result = await tx.oneOrNone(`
    SELECT "id", "code", "description" as "value", "type" FROM "Documents" WHERE id = @p1`, [id]);
    return result;
}
async function debit(account, date = new Date().toJSON(), company) {
    const result = await mssql_1.sdb.oneOrNone(`
    SELECT SUM(sum) result FROM "Register.Account"
    WHERE dt = @p1 AND datetime <= @p2 AND company = @p3`, [account, date, company]);
    return result ? result.result : null;
}
async function kredit(account, date = new Date().toJSON(), company) {
    const result = await mssql_1.sdb.oneOrNone(`
    SELECT SUM(sum) result FROM "Register.Account"
    WHERE kt = @p1 AND datetime <= @p2 AND company = @p3`, [account, date, company]);
    return result ? result.result : null;
}
async function balance(account, date = new Date().toJSON(), company) {
    const result = await mssql_1.sdb.oneOrNone(`
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
async function registerBalance(type, date = new Date(), resource, analytics, tx = mssql_1.sdb) {
    const addFields = (key) => `SUM(JSON_VALUE(data, '$.${key}') * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "${key}",\n`;
    let fields = '';
    for (const el of resource) {
        fields += addFields(el);
    }
    fields = fields.slice(0, -2);
    const addWhere = (key) => `NEAR((${key}, ${analytics[key]}),1) AND `;
    let where = '';
    for (const el of resource) {
        where += addWhere(el);
    }
    where = where.slice(0, -4);
    const result = await mssql_1.sdb.oneOrNone(`
    SELECT ${fields}
    FROM "Accumulation"
    WHERE (1=1)
      AND date <= @p1
      AND type = @p2
      AND CONTAINS(data, '${where}')
  `, [date, type]);
    return (result ? result : {});
}
async function avgCost(date = new Date(), analytics, tx = mssql_1.sdb) {
    const queryText = `
    SELECT
      SUM(JSON_VALUE(data, '$.Cost') * CASE WHEN kind = 1 THEN 1 ELSE -1 END) /
      NULLIF(SUM(JSON_VALUE(data, '$.Qty') * CASE WHEN kind = 1 THEN 1 ELSE -1 END), 0) result
    FROM "Accumulation"
    WHERE (1=1)
      AND date <= @p1
      AND type = 'Register.Accumulation.Sales'
      AND company = '${analytics.company}'
      AND CONTAINS(data, 'NEAR((SKU, ${analytics.SKU}),1) AND NEAR((Storehouse, ${analytics.Storehouse}),1)')
    `;
    const result = await tx.oneOrNone(queryText, [date]);
    return result ? result.result : null;
}
async function inventoryBalance(date = new Date(), analytics, tx = mssql_1.sdb) {
    const queryText = `
    SELECT
      SUM(JSON_VALUE(data, '$.Qty') * CASE WHEN kind = 1 THEN 1 ELSE -1 END) result
    FROM "Register.Accumulation"
    WHERE (1=1)
      AND date <= @p1
      AND type = 'Register.Accumulation.Sales'
      AND company = '${analytics.company}'
      AND CONTAINS(data, 'NEAR((SKU, ${analytics.SKU}),1) AND NEAR((Storehouse, ${analytics.Storehouse}),1)')
    `;
    const result = await tx.oneOrNone(queryText, [date]);
    return result ? result.result : null;
}
async function sliceLast(type, date = new Date(), company, resource, analytics, tx = mssql_1.sdb) {
    const addWhere = (key) => `NEAR((${key}, ${analytics[key]}),1) AND `;
    let where = '';
    for (const el of resource) {
        where += addWhere(el);
    }
    where = where.slice(0, -4);
    const queryText = `
    SELECT TOP 1 JSON_VALUE(data, '$.${resource}') result FROM "Register.Info"
    WHERE (1=1)
      AND date <= @p1
      AND type = '${type}'
      AND company = '${company}'
      AND CONTAINS(data, '${where}')
    ORDER BY date DESC`;
    const result = await tx.oneOrNone(queryText, [date]);
    return result ? result.result : null;
}
async function postById(id, posted, tx = mssql_1.sdb) {
    return tx.tx(async (subtx) => {
        const doc = await exports.lib.doc.byId(id, subtx);
        let serverDoc = documents_factory_server_1.createDocumentServer(doc.type, doc);
        if (serverDoc.isDoc) {
            await subtx.none(`
        DELETE FROM "Register.Account" WHERE document = @p1;
        DELETE FROM "Register.Info" WHERE document = @p1;
        DELETE FROM "Accumulation" WHERE document = @p1;
        UPDATE "Documents" SET posted = @p2 WHERE id = @p1`, [id, posted ? 1 : 0]);
        }
        if (posted && serverDoc.onPost) {
            await execute_script_1.InsertRegisterstoDB(doc, await serverDoc.onPost(subtx), subtx);
        }
        serverDoc = undefined;
    });
}
exports.postById = postById;
//# sourceMappingURL=std.lib.js.map
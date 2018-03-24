"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./models/config");
const documents_factory_server_1 = require("./models/documents.factory.server");
const mssql_1 = require("./mssql");
const execute_script_1 = require("./routes/utils/execute-script");
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
        inventoryBalance,
        avgCost,
        movementsByDoc,
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
    },
    inventory: {
        batch: batch
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
  JSON_QUERY(doc) doc from Documents WHERE id = @p1`, [id]);
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
    const addFields = (key) => `SUM("${key}") "${key}",\n`;
    let fields = '';
    for (const el of resource) {
        fields += addFields(el);
    }
    fields = fields.slice(0, -2);
    const addWhere = (key) => `AND "${key}" = '${analytics[key]}'\n`;
    let where = '';
    for (const el of resource) {
        where += addWhere(el);
    }
    where = where.slice(0, -2);
    const queryText = `
  SELECT ${fields}
  FROM "${type}"
  WHERE (1=1)
    AND date <= @p1
    ${where}
  `;
    const result = await mssql_1.sdb.oneOrNone(queryText, [date]);
    return (result ? result : {});
}
async function avgCost(date, analytics, tx = mssql_1.sdb) {
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
    const result = await tx.oneOrNone(queryText, [date, analytics.company, analytics.SKU, analytics.Storehouse]);
    return result ? result.result : null;
}
async function inventoryBalance(date, analytics, tx = mssql_1.sdb) {
    const queryText = `
  SELECT
    SUM("Cost") "Cost", SUM("Qty") "Qty"
    FROM "Register.Accumulation.Inventory"
    WHERE (1=1)
      AND date <= @p1
      AND company = @p2
      AND "SKU" = @p3
      AND "Storehouse" = @p4`;
    const result = await tx.oneOrNone(queryText, [date, analytics.company, analytics.SKU, analytics.Storehouse]);
    return result ? { Cost: result.Cost, Qty: result.Qty } : null;
}
async function sliceLast(type, date = new Date(), company, resource, analytics, tx = mssql_1.sdb) {
    const addWhere = (key) => `NEAR((${key}, ${analytics[key]}),1) AND `;
    let where = '';
    for (const el of Object.keys(analytics)) {
        where += addWhere(el);
    }
    where = where.slice(0, -4);
    const queryText = `
    SELECT TOP 1 JSON_VALUE(data, '$.${resource}') result FROM "Register.Info"
    WHERE (1=1)
      AND date <= @p1
      AND type = 'Register.Info.${type}'
      AND company = '${company}'
      AND CONTAINS(data, '${where}')
    ORDER BY date DESC`;
    const result = await tx.oneOrNone(queryText, [date]);
    return result ? result.result : null;
}
async function postById(id, posted, tx = mssql_1.sdb) {
    return tx.tx(async (subtx) => {
        const doc = await exports.lib.doc.byId(id, subtx);
        let serverDoc = await documents_factory_server_1.createDocumentServer(doc.type, doc);
        if (serverDoc.isDoc) {
            await subtx.none(`
        DELETE FROM "Register.Account" WHERE document = @p1;
        DELETE FROM "Register.Info" WHERE document = @p1;
        DELETE FROM "Accumulation" WHERE document = @p1;
        UPDATE "Documents" SET posted = @p2 WHERE id = @p1`, [id, posted ? 1 : 0]);
        }
        if (posted && serverDoc.onPost && !doc.deleted) {
            await execute_script_1.InsertRegisterstoDB(doc, await serverDoc.onPost(subtx), subtx);
        }
        serverDoc = undefined;
    });
}
exports.postById = postById;
async function movementsByDoc(type, doc, tx = mssql_1.sdb) {
    const queryText = `
  SELECT kind, date, type, company, document, JSON_QUERY(data) data
  FROM Accumulation where type = '${type}' AND document = '${doc}'`;
    return await tx.manyOrNone(queryText);
}
exports.movementsByDoc = movementsByDoc;
async function batch(date, company, rows, tx = mssql_1.sdb) {
    const rowsKeys = rows.map(r => r.Storehouse + r.SKU);
    const uniquerowsKeys = rowsKeys.filter((v, i, a) => a.indexOf(v) === i);
    const grouped = uniquerowsKeys.map(r => {
        const filter = rows.filter(f => f.Storehouse + f.SKU === r);
        const Qty = filter.reduce((a, b) => a + b.Qty, 0);
        const res1 = filter.reduce((a, b) => a + b.res1, 0);
        const res2 = filter.reduce((a, b) => a + b.res2, 0);
        const res3 = filter.reduce((a, b) => a + b.res3, 0);
        const res4 = filter.reduce((a, b) => a + b.res4, 0);
        const res5 = filter.reduce((a, b) => a + b.res5, 0);
        return ({ SKU: filter[0].SKU, Storehouse: filter[0].Storehouse, Qty, Cost: 0, batch: null, res1, res2, res3 });
    });
    const result = [];
    for (const row of grouped) {
        const queryText = `
      SELECT
        batch,
        MIN(date) date,
        SUM("Qty") Qty,
        SUM("Cost.In") / NULLIF(SUM("Qty.In"), 1) Cost
      FROM "Register.Accumulation.Inventory" r
      WHERE (1=1)
        AND date <= @p1
        AND company = @p2
        AND "SKU" = @p3
        AND "Storehouse" = @p4
      GROUP BY batch
      HAVING SUM("Qty") > 0
      ORDER BY date, batch`;
        const queryResult = await tx.manyOrNone(queryText, [date, company, row.SKU, row.Storehouse]);
        let total = row.Qty;
        for (const a of queryResult) {
            if (total <= 0)
                break;
            const q = Math.min(total, a.Qty);
            const rate = q / row.Qty;
            result.push({
                batch: a.batch, Qty: q, Cost: a.Cost * q, Storehouse: row.Storehouse, SKU: row.SKU,
                res1: row.res1 * rate, res2: row.res2 * rate, res3: row.res3 * rate, res4: row.res3 * rate, res5: row.res3 * rate
            });
            total = total - q;
        }
        if (total > 0) {
            const SKU = await exports.lib.doc.byId(row.SKU, tx);
            throw new Error(`Не достаточно ${total} единиц ${SKU.description}`);
        }
    }
    return result;
}
exports.batch = batch;
//# sourceMappingURL=std.lib.js.map
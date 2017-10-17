const db = require('./db');

const lib = {
    account: {
        balance: balance,
        debit: debit,
        kredit: kredit,
        byCode: accountByCode
    },
    doc: {
        byCode: byCode
    }
}

async function accountByCode(code) {
    const result = await db.oneOrNone(`
        SELECT id result FROM "Documents" 
        WHERE type = 'Catalog.Account' AND code = $1`, [code]);
    return result.result;
}

async function byCode(type, code) {
    const result = await db.oneOrNone(`
        SELECT id result FROM "Documents" 
        WHERE type = $1 AND code = $2`, [type, code]);
    return result.result;
}

async function debit(company, account, date) {
    const result = await db.one(`
        SELECT SUM(sum) result 
        FROM "Register.Account" a 
        JOIN "Documents" da ON da.code = a.dt and da.type = 'Catalog.Account'
        JOIN "Documents" dc ON dc.id = a.company and dc.type = 'Catalog.Company'
        WHERE da.code = $1 AND a.datetime <= $2 AND dc.code = $3`, [account, date, company]);
    return result.result;
}

async function kredit(account, date) {
    const result = await db.one(`
        SELECT SUM(sum) result 
        FROM "Register.Account" a 
        JOIN "Documents" da ON da.code = a.kt and da.type = 'Catalog.Account'
        WHERE da.code = $1 AND a.datetime <= $2`, [account, date]);
    return result.result;
}

async function balance(account, date = new Date(), company) {
    const result = await db.one(`
        SELECT SUM(sum) result 
        FROM "Register.Account"
        WHERE dt = $1 AND datetime <= $2 AND company = $3`, [account, date, company]);
    return result.result;
}

module.exports = lib;
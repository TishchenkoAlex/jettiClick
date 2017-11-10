"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const db_1 = require("./db");
const user_settings_1 = require("./models/user.settings");
const index_1 = require("./modules/index");
const std_lib_1 = require("./std.lib");
exports.router = express.Router();
exports.router.get('/catalogs', async (req, res, next) => {
    try {
        res.json(await db_1.db.manyOrNone(`
      SELECT type, description, icon, menu FROM config_schema WHERE chapter = 'Catalog' ORDER BY description`));
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/documents', async (req, res, next) => {
    try {
        res.json(await db_1.db.manyOrNone(`
      SELECT type, description, icon, menu FROM config_schema WHERE chapter = 'Document' ORDER BY description`));
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/operations/groups', async (req, res, next) => {
    try {
        res.json(await db_1.db.manyOrNone(`
      SELECT id, description, code FROM "Documents" WHERE type = 'Catalog.Operation.Group' ORDER BY description`));
    }
    catch (err) {
        next(err.message);
    }
});
async function ExecuteScript(doc, script, tx) {
    const d1 = new Date();
    const Registers = { Account: [], Accumulation: [], Info: [] };
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const func = new AsyncFunction('doc, Registers, tx, lib', script);
    await func(doc, Registers, tx, std_lib_1.lib);
    // if (JDM[doc.type].post) {  await JDM[doc.type].post(doc, Registers, tx) };
    // console.log('Registers', (new Date().getTime() - d1.getTime()) / 1000);
    let query = '';
    for (const rec of Registers.Account) {
        query += `
      INSERT INTO "Register.Account" (
        datetime, document, operation, sum, company,
        dt, dt_subcount1, dt_subcount2, dt_subcount3, dt_subcount4, dt_qty, dt_cur,
        kt, kt_subcount1, kt_subcount2, kt_subcount3, kt_subcount4, kt_qty, kt_cur )
      VALUES (
        '${new Date(doc.date).toJSON()}',
        '${doc.id}', '${rec.operation || doc.doc.Operation || doc.type}', ${rec.sum || 0}, '${rec.company || doc.company}',
        '${rec.debit.account}',
        '${rec.debit.subcounts[0]}', '${rec.debit.subcounts[1]}',
        '${rec.debit.subcounts[2]}', '${rec.debit.subcounts[3]}',
        ${rec.debit.qty || 0}, '${rec.debit.currency || doc.doc.currency}',
        '${rec.kredit.account}',
        '${rec.kredit.subcounts[0]}', '${rec.kredit.subcounts[1]}',
        '${rec.kredit.subcounts[2]}', '${rec.kredit.subcounts[3]}',
        ${rec.kredit.qty || 0}, '${rec.kredit.currency || doc.doc.currency}'
      );`;
    }
    ;
    for (const rec of Registers.Accumulation) {
        const data = JSON.stringify(rec.data);
        query += `
      INSERT INTO "Register.Accumulation" (kind, type, date, document, company, data)
      VALUES (${rec.kind}, '${rec.type}', '${new Date(doc.date).toJSON()}', '${doc.id}', '${rec.company || doc.company}', '${data}');`;
    }
    ;
    for (const rec of Registers.Info) {
        const data = JSON.stringify(rec.data);
        query += `
      INSERT INTO "Register.Info" (type, date, document, company, data)
      VALUES ('${rec.type}', '${new Date(doc.date).toJSON()}', '${doc.id}', '${rec.company || doc.company}', '${data}');`;
    }
    ;
    if (query) {
        await tx.none(query);
    }
    ;
    // console.log('TOTAL SCRIPTS', (new Date().getTime() - d1.getTime()) / 1000);
    return doc;
}
async function docOperationResolver(doc, tx) {
    if (doc.type !== 'Document.Operation') {
        return;
    }
    ; // only for Operations docs
    for (let i = 1; i <= 10; i++) {
        const p = doc['p' + i.toString()];
        if (p instanceof Array) {
            for (const el of p) {
                for (const key in el) {
                    if (typeof el[key] === 'string') {
                        const data = await std_lib_1.lib.doc.formControlRef(el[key], tx); // todo check types in model
                        if (data) {
                            el[key] = data;
                        }
                    }
                }
            }
        }
    }
}
// Select documents list for UI (grids/list etc)
exports.router.post('/list', async (req, res, next) => {
    try {
        const params = req.body;
        params.command = params.command || 'first';
        const direction = params.command !== 'prev';
        const config_schema = await db_1.db.one(`SELECT "queryList" FROM config_schema WHERE type = $1`, [params.type]);
        const row = await db_1.db.oneOrNone(`SELECT row_to_json(q) "row" FROM (${config_schema.queryList} AND d.id = $1) q`, [params.id]);
        const valueOrder = [];
        params.order.filter(el => el.order !== '').forEach(el => {
            valueOrder.push({ field: el.field, order: el.order || 'asc', value: row ? row['row'][el.field] || '' : null });
        });
        const lastORDER = valueOrder.length ? valueOrder[valueOrder.length - 1].order === 'asc' : true;
        valueOrder.push({ field: 'id', order: lastORDER ? 'asc' : 'desc', value: params.id });
        let orderbyBefore = ' ORDER BY ';
        let orderbyAfter = orderbyBefore;
        valueOrder.forEach(o => orderbyBefore += '"' + o.field + (o.order === 'asc' ? '" DESC, ' : '" ASC, '));
        orderbyBefore = orderbyBefore.slice(0, -2);
        valueOrder.forEach(o => orderbyAfter += '"' + o.field + (o.order === 'asc' ? '" ASC, ' : '" DESC, '));
        orderbyAfter = orderbyAfter.slice(0, -2);
        const filterBuilder = (filter) => {
            let where = ' TRUE ';
            filter.filter(f => f.right).forEach(f => {
                let operator = f.center.toString();
                if (f.center === 'like') {
                    operator = 'ILIKE';
                }
                const value = f.right['value'] || f.right;
                switch (operator) {
                    case '=':
                    case '>=':
                    case '<=':
                    case '>':
                    case '<':
                        if (typeof value === 'object') {
                            return;
                        }
                        where += ` AND d."${f.left}" ${operator} '${value}'`;
                        break;
                    case 'ILIKE':
                        where += ` AND d."${f.left}" ${operator} '%${value['value'] || value}%'`;
                        break;
                    case 'beetwen':
                        const interval = f.right;
                        if (interval.start) {
                            where += ` AND d."${f.left}" >= '${interval.start}'`;
                        }
                        if (interval.end) {
                            where += ` AND d."${f.left}" <= '${interval.end}'`;
                        }
                        break;
                }
            });
            return where;
        };
        const queryBuilder = (isAfter) => {
            // tslint:disable-next-line:no-shadowed-variable
            let result = '';
            const order = valueOrder.slice();
            const char1 = lastORDER ? isAfter ? '>' : '<' : isAfter ? '<' : '>';
            valueOrder.forEach(o => {
                let where = filterBuilder(params.filter || []);
                order.forEach(_o => where += ` AND "${_o.field}" ${_o !== order[order.length - 1] ? '=' :
                    char1 + ((_o.field === 'id') && isAfter ? '=' : '')} '${_o.value}' `);
                order.length--;
                result += `\nSELECT * FROM(SELECT * FROM(${config_schema.queryList}) d WHERE ${where}\n${lastORDER ?
                    (char1 === '>') ? orderbyAfter : orderbyBefore :
                    (char1 === '<') ? orderbyAfter : orderbyBefore} LIMIT ${params.count + 1}) "tmp${o.field}"\nUNION ALL`;
            });
            return result.slice(0, -9);
        };
        let query = '';
        if (params.command === 'first') {
            const where = filterBuilder(params.filter || []);
            query = `SELECT * FROM (SELECT * FROM(${config_schema.queryList}) d WHERE ${where}\n${orderbyAfter} LIMIT ${params.count + 1}) d`;
        }
        else {
            if (params.command === 'last') {
                const where = filterBuilder(params.filter || []);
                query = `SELECT * FROM (SELECT * FROM(${config_schema.queryList}) d WHERE ${where}\n${orderbyBefore} LIMIT ${params.count + 1}) d`;
            }
            else {
                const queryBefore = queryBuilder(true);
                const queryAfter = queryBuilder(false);
                query = `${queryBefore} \nUNION ALL\n${queryAfter} `;
            }
            query = `SELECT * FROM (${query}) d ${orderbyAfter}`;
        }
        query = `SELECT d.*,
    (select count(*) FROM "Documents" where parent = d.id) "childs",
    (select count(*) FROM "Documents" where id = d.parent) "parents" FROM (${query}) d ${orderbyAfter}`;
        // console.log(query);
        const data = await db_1.db.manyOrNone(query);
        let result = [];
        const continuation = { first: null, last: null };
        const calculateContinuation = () => {
            const continuationIndex = data.findIndex(d => d.id === params.id);
            const pageSize = Math.min(data.length, params.count);
            if (params.command === 'first') {
                continuation.first = null;
                continuation.last = data[pageSize];
                result = data.slice(0, pageSize);
            }
            else {
                if (params.command === 'last') {
                    continuation.first = data[data.length - 1 - params.count];
                    continuation.last = null;
                    result = data.slice(-pageSize);
                }
                else {
                    if (direction) {
                        continuation.first = data[continuationIndex - params.offset - 1];
                        continuation.last = data[continuationIndex + pageSize - params.offset];
                        result = data.slice(continuation.first ? continuationIndex - params.offset : 0, continuationIndex + pageSize - params.offset);
                        if (result.length < pageSize) {
                            const first = Math.max(continuationIndex - params.offset - (pageSize - result.length), 0);
                            const last = Math.max(continuationIndex - params.offset + result.length, pageSize);
                            continuation.first = data[first - 1];
                            continuation.last = data[last + 1];
                            result = data.slice(first, last);
                        }
                    }
                    else {
                        continuation.first = data[continuationIndex - pageSize - params.offset];
                        continuation.last = data[continuationIndex + 1 - params.offset];
                        result = data.slice(continuation.first ?
                            continuationIndex - pageSize + 1 - params.offset : 0, continuationIndex + 1 - params.offset);
                        if (result.length < pageSize) {
                            continuation.first = null;
                            continuation.last = data[pageSize + 1];
                            result = data.slice(0, pageSize);
                        }
                    }
                }
            }
        };
        calculateContinuation();
        result.length = Math.min(result.length, params.count);
        res.json({ data: result, continuation: continuation });
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/:type/view/*', async (req, res, next) => {
    try {
        const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
        const config_schema = await db_1.db.one(`
      SELECT "queryObject", "queryNewObject",
        (select settings->'${req.params.type}' result from users where email = '${user}') settings,
        (SELECT schema FROM config_schema WHERE type = 'doc') || config_schema.schema AS "schemaFull"
      FROM config_schema WHERE type = $1`, [req.params.type]);
        const view = config_schema.schemaFull;
        const settings = config_schema.settings || new user_settings_1.FormListSettings();
        const columnDef = [];
        Object.keys(view).filter(property => view[property] && view[property]['type'] !== 'table').map((property) => {
            const prop = view[property];
            const hidden = !!prop['hidden-list'];
            const order = hidden ? 1000 : prop['order'] * 1 || 999;
            const label = (prop['label'] || property.toString()).toLowerCase();
            const type = prop['type'] || 'string';
            const style = prop['style'] || '';
            columnDef.push({
                field: property, type: type, label: label, hidden: hidden, order: order, style: style,
                filter: settings.filter.find(f => f.left === property) || new user_settings_1.FormListFilter(property),
                sort: settings.order.find(f => f.field === property) || new user_settings_1.FormListOrder(property)
            });
        });
        columnDef.sort((a, b) => a.order - b.order);
        let model;
        const id = req.params['0'];
        if (id) {
            if (id.startsWith('copy-')) {
                model = await db_1.db.one(`${config_schema.queryObject} AND d.id = $1`, [id.slice(5)]);
                const newDoc = await db_1.db.one('SELECT uuid_generate_v1mc() id, now() date');
                model.id = newDoc.id;
                model.date = newDoc.date;
                model.code = '';
                model.posted = false;
                model.deleted = false;
                model.parent = Object.assign({}, model.parent, { id: null, code: null, value: null });
                model.description = 'Copy: ' + model.description;
            }
            else {
                if (id.startsWith('base-')) {
                    model = await db_1.db.one(`${config_schema.queryNewObject}`);
                    const source = await std_lib_1.lib.doc.modelById(id.slice(5));
                    model = Object.assign({}, model, source);
                }
                else {
                    model = await db_1.db.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
                }
            }
            await docOperationResolver(model, db_1.db);
        }
        else {
            model = config_schema.queryNewObject ? await db_1.db.one(`${config_schema.queryNewObject}`) : {};
        }
        const result = { view: view, model: model, columnDef: columnDef };
        res.json(result);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/suggest/:id', async (req, res, next) => {
    try {
        const query = `
      SELECT id as id, description as value, code as code, type as type
      FROM "Documents" WHERE id = $1`;
        const data = await db_1.db.oneOrNone(query, req.params.id);
        res.json(data);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/suggest/:type/*', async (req, res, next) => {
    try {
        const query = `
      SELECT id as id, description as value, code as code, type as type
      FROM "Documents" WHERE type = '${req.params.type}'
      AND (description ILIKE '%${req.params[0]}%' OR code ILIKE '%${req.params[0]}%' OR id = '${req.params[0]}')
      ORDER BY type, description LIMIT 10`;
        const data = await db_1.db.manyOrNone(query);
        res.json(data);
    }
    catch (err) {
        next(err.message);
    }
});
// Delete document
exports.router.delete('/:id', async (req, res, next) => {
    try {
        await db_1.db.tx(async (tx) => {
            const id = req.params.id;
            let doc = await DocById(id, tx);
            await doSubscriptions(doc, 'before detele', tx);
            const config_schema = (await tx.one(`
        SELECT "queryObject", "beforeDelete", "afterDelete" FROM config_schema WHERE type = $1`, [doc.type]));
            if (config_schema['beforeDelete']) {
                await ExecuteScript(doc, config_schema['beforeDelete'], tx);
            }
            doc = await tx.one('UPDATE "Documents" SET deleted = not deleted, posted = false WHERE id = $1 RETURNING *;', [id]);
            if (config_schema['afterDelete']) {
                await ExecuteScript(doc, config_schema['afterDelete'], tx);
            }
            await doSubscriptions(doc, 'after detele', tx);
            const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
            await docOperationResolver(model, tx);
            res.json(model);
        });
    }
    catch (err) {
        next(err.message);
    }
});
// Upsert document
async function post(doc, tx) {
    const id = doc.id;
    const isNew = (await tx.oneOrNone('SELECT id FROM "Documents" WHERE id = $1', [id]) === null);
    await doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
    const config_schema = (await tx.one(`
      SELECT "queryObject", replace("beforePost", '$.', 'doc.doc.') "beforePost",
        replace("afterPost", '$.', 'doc.doc.') "afterPost" FROM config_schema WHERE type = $1`, [doc.type]));
    await tx.none(`
        DELETE FROM "Register.Account" WHERE document = $1;
        DELETE FROM "Register.Info" WHERE document = $1;
        DELETE FROM "Register.Accumulation" WHERE document = $1;`, id);
    if (!!doc.posted && config_schema['beforePost']) {
        await ExecuteScript(doc, config_schema['beforePost'], tx);
    }
    if (isNew) {
        doc = await tx.one(`
      INSERT INTO "Documents" SELECT * FROM json_populate_record(null::"Documents", $1) RETURNING *;`, [doc]);
    }
    else {
        doc = await tx.one(`
        UPDATE "Documents" d
          SET
            type = i.type, parent = i.parent,
            date = i.date, code = i.code, description = i.description,
            posted = i.posted, deleted = i.deleted, isfolder = i.isfolder,
            "user" = i.user, company = i.company, info = i.info,
            doc = i.doc
          FROM (SELECT * FROM json_populate_record(null::"Documents", $1)) i
          WHERE d.id = i.id RETURNING *;`, [doc]);
    }
    if (!!doc.posted && config_schema['afterPost']) {
        await ExecuteScript(doc, config_schema['afterPost'], tx);
    }
    await doSubscriptions(JSON.parse(JSON.stringify(doc)), isNew ? 'after insert' : 'after update', tx);
    return doc;
}
// Upsert document
exports.router.post('/', async (req, res, next) => {
    try {
        let doc;
        await db_1.db.tx(async (tx) => {
            doc = await post(req.body, tx);
            const config_schema = await tx.one(`SELECT "queryObject" FROM config_schema WHERE type = $1`, [doc.type]);
            doc = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [doc.id]);
            await docOperationResolver(doc, tx);
        });
        res.json(doc);
    }
    catch (err) {
        next(err.message);
    }
});
// Post by id (without returns posted object to client, for post in cicle many docs)
exports.router.get('/post/:id', async (req, res, next) => {
    try {
        const d1 = new Date();
        await db_1.db.tx(async (tx) => {
            const doc = await DocById(req.params.id, tx);
            doc.posted = !doc.posted;
            await post(doc, tx);
        });
        res.json(true);
    }
    catch (err) {
        next(err.message);
    }
});
async function doSubscriptions(doc, script, tx) {
    const scripts = await tx.manyOrNone(`
    SELECT "then" FROM "Subscriptions" WHERE "what" ? $1 AND "when" = $2 ORDER BY "order"`, [doc.type, script]);
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    for (const scr of scripts) {
        const func = new AsyncFunction('doc, db', scr.then);
        await func(doc, tx);
    }
    ;
}
// Get document by id ROUTE
exports.router.get('/raw/:id', async (req, res, next) => {
    try {
        res.json(await DocById(req.params.id, db_1.db));
    }
    catch (err) {
        next(err.message);
    }
});
// Get document by id
async function DocById(id, tx) {
    return await tx.oneOrNone(`select * from "Documents" WHERE id = $1`, [id]);
}
exports.router.get('/register/account/movements/view/:id', async (req, res, next) => {
    try {
        const query = `SELECT * FROM "Register.Account.View" where document_id = $1`;
        const data = await db_1.db.manyOrNone(query, [req.params.id]);
        res.json(data);
    }
    catch (err) {
        next(err.message);
    }
});
// server onChangeValue
exports.router.post('/call', async (req, res, next) => {
    try {
        let result = {};
        await db_1.db.tx(async (tx) => {
            const params = req.body;
            const query = `SELECT module FROM config_schema WHERE type = $1`;
            const moduleScript = (await db_1.db.one(query, [params.doc.type])).module;
            if (moduleScript) {
                const func = (new Function(moduleScript))();
                result = await func[`${params.prop}_valueChanges`](params.doc, params.value, std_lib_1.lib);
            }
        });
        res.json(result);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.post('/valueChanges/:type/:property', async (req, res, next) => {
    try {
        const doc = req.body.doc;
        const value = req.body.value;
        const Module = index_1.valueChanges[req.params.type];
        let result = {};
        if (Module) {
            result = await Module[req.params.property](doc, value);
        }
        res.json(result);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/register/accumulation/list/:id', async (req, res, next) => {
    try {
        const result = await db_1.db.manyOrNone(`
      SELECT DISTINCT r.type, s.description FROM "Register.Accumulation" r
      LEFT JOIN config_schema s ON s.type = r.type
      WHERE document = $1`, [req.params.id]);
        res.json(result);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/register/accumulation/:type/:id', async (req, res, next) => {
    try {
        const config_schema = await db_1.db.one(`
      SELECT "queryObject" query FROM config_schema WHERE type = $1`, [req.params.type]);
        const result = await db_1.db.manyOrNone(`${config_schema.query} AND r.document = $1`, [req.params.id]);
        res.json(result);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/user/settings/defaults', async (req, res, next) => {
    try {
        const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
        const query = `select settings->'defaults' result from users where email = '${user}'`;
        const result = await db_1.db.oneOrNone(query);
        res.json(result.result || new user_settings_1.UserDefaultsSettings());
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.post('/user/settings/defaults', async (req, res, next) => {
    try {
        const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
        const data = req.body || new user_settings_1.UserDefaultsSettings();
        const query = `update users set settings = jsonb_set(settings, '{"defaults"}, $1) where email = '${user}'`;
        const result = await db_1.db.none(query, [data]);
        res.json(true);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.get('/user/settings/:type', async (req, res, next) => {
    try {
        const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
        const query = `select settings->'${req.params.type}' result from users where email = '${user}'`;
        const result = await db_1.db.oneOrNone(query);
        res.json(result.result);
    }
    catch (err) {
        next(err.message);
    }
});
exports.router.post('/user/settings/:type', async (req, res, next) => {
    try {
        const user = (req.user && req.user.sub && req.user.sub.split('|')[1]) || '';
        const data = req.body || {};
        const query = `update users set settings = jsonb_set(settings, '{"${req.params.type}"}', $1) where email = '${user}'`;
        const settings = await db_1.db.none(query, [data]);
        res.json(true);
    }
    catch (err) {
        next(err.message);
    }
});
//# sourceMappingURL=routes.js.map
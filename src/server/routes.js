"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const db_1 = require("./db");
const ExecuteScript_1 = require("./fuctions/ExecuteScript");
const user_settings_1 = require("./models/user.settings");
const index_1 = require("./modules/index");
const std_lib_1 = require("./std.lib");
const List_1 = require("./fuctions/List");
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
exports.router.get('/:type/dimensions', async (req, res, next) => {
    try {
        let result = await db_1.db.oneOrNone(`SELECT dimensions FROM config_schema WHERE type = $1`, [req.params.type]);
        if (result) {
            result = result.dimensions || [];
        }
        else {
            result = [];
        }
        res.json(result);
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
      SELECT id, type, description as value, code FROM "Documents" WHERE type = 'Catalog.Operation.Group' ORDER BY description`));
    }
    catch (err) {
        next(err.message);
    }
});
// Select documents list for UI (grids/list etc)
exports.router.post('/list', async (req, res, next) => {
    try {
        const result = await List_1.List(req, res);
        res.json(result);
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
        const columnDef = ExecuteScript_1.buildColumnDef(view, config_schema.settings || new user_settings_1.FormListSettings());
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
            await ExecuteScript_1.docOperationResolver(model, db_1.db);
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
            let doc = await std_lib_1.lib.doc.byId(id, tx);
            await ExecuteScript_1.doSubscriptions(doc, 'before detele', tx);
            const config_schema = (await tx.one(`
        SELECT "queryObject", "beforeDelete", "afterDelete" FROM config_schema WHERE type = $1`, [doc.type]));
            if (config_schema['beforeDelete']) {
                await ExecuteScript_1.ExecuteScript(doc, config_schema['beforeDelete'], tx);
            }
            doc = await tx.one('UPDATE "Documents" SET deleted = not deleted, posted = false WHERE id = $1 RETURNING *;', [id]);
            if (config_schema['afterDelete']) {
                await ExecuteScript_1.ExecuteScript(doc, config_schema['afterDelete'], tx);
            }
            await ExecuteScript_1.doSubscriptions(doc, 'after detele', tx);
            const model = await tx.one(`${config_schema.queryObject} AND d.id = $1`, [id]);
            await ExecuteScript_1.docOperationResolver(model, tx);
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
    await ExecuteScript_1.doSubscriptions(doc, isNew ? 'before insert' : 'before update', tx);
    const config_schema = (await tx.one(`
      SELECT "queryObject", replace("beforePost", '$.', 'doc.doc.') "beforePost",
        replace("afterPost", '$.', 'doc.doc.') "afterPost" FROM config_schema WHERE type = $1`, [doc.type]));
    await tx.none(`
        DELETE FROM "Register.Account" WHERE document = $1;
        DELETE FROM "Register.Info" WHERE document = $1;
        DELETE FROM "Register.Accumulation" WHERE document = $1;`, id);
    if (!!doc.posted && config_schema['beforePost']) {
        await ExecuteScript_1.ExecuteScript(doc, config_schema['beforePost'], tx);
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
    if (!!doc.posted) {
        await ExecuteScript_1.ExecuteScript(doc, config_schema['afterPost'] || 'post', tx);
    }
    await ExecuteScript_1.doSubscriptions(JSON.parse(JSON.stringify(doc)), isNew ? 'after insert' : 'after update', tx);
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
            await ExecuteScript_1.docOperationResolver(doc, tx);
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
        await db_1.db.tx(async (tx) => {
            const doc = await std_lib_1.lib.doc.byId(req.params.id, tx);
            doc.posted = !doc.posted;
            await post(doc, tx);
        });
        res.json(true);
    }
    catch (err) {
        next(err.message);
    }
});
// Get document by id ROUTE
exports.router.get('/raw/:id', async (req, res, next) => {
    try {
        res.json(await std_lib_1.lib.doc.byId(req.params.id, db_1.db));
    }
    catch (err) {
        next(err.message);
    }
});
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
exports.router.post('/valueChanges/:type/:property', async (req, res, next) => {
    try {
        const doc = req.body.doc;
        const value = req.body.value;
        const property = req.params.property;
        const type = req.params.type;
        const result = index_1.JDM[type] && index_1.JDM[type].valueChanges && index_1.JDM[type].valueChanges[property] ?
            await index_1.JDM[type].valueChanges[property](doc, value) : {};
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
exports.router.get('/register/info/list/:id', async (req, res, next) => {
    try {
        const result = await db_1.db.manyOrNone(`
      SELECT DISTINCT r.type, s.description FROM "Register.Info" r
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// node_modules/typescript/bin/tsc -p ./src/server/ && node src/server/index.js
require("reflect-metadata");
const bodyParser = require("body-parser");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const httpServer = require("http");
const path = require("path");
const socketIO = require("socket.io");
const tasks_1 = require("./models/Tasks/tasks");
const auth_1 = require("./routes/auth");
const documents_1 = require("./routes/documents");
const check_auth_1 = require("./routes/middleware/check-auth");
const registers_1 = require("./routes/registers");
const server_1 = require("./routes/server");
const suggest_1 = require("./routes/suggest");
const tasks_2 = require("./routes/tasks");
const user_settings_1 = require("./routes/user.settings");
const utils_1 = require("./routes/utils");
const environment_1 = require("./env/environment");
const root = './';
const app = express();
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));
app.use('/liveness_check', (req, res, next) => res.json('liveness_check'));
console.log('SUBSCRIPTION_ID', environment_1.SUBSCRIPTION_ID, `${environment_1.SUBSCRIPTION_ID}/api`);
let api = `${environment_1.SUBSCRIPTION_ID}/api`;
app.use(api, check_auth_1.default, server_1.router);
app.use(api, check_auth_1.default, documents_1.router);
app.use(api, check_auth_1.default, user_settings_1.router);
app.use(api, check_auth_1.default, suggest_1.router);
app.use(api, check_auth_1.default, utils_1.router);
app.use(api, check_auth_1.default, registers_1.router);
app.use(api, check_auth_1.default, tasks_2.router);
app.use(`${environment_1.SUBSCRIPTION_ID}/auth`, auth_1.router);
app.use('/auth', auth_1.router);
api = `/api`;
app.use(api, check_auth_1.default, server_1.router);
app.use(api, check_auth_1.default, documents_1.router);
app.use(api, check_auth_1.default, user_settings_1.router);
app.use(api, check_auth_1.default, suggest_1.router);
app.use(api, check_auth_1.default, utils_1.router);
app.use(api, check_auth_1.default, registers_1.router);
app.use(api, check_auth_1.default, tasks_2.router);
app.get('*', (req, res) => {
    console.log('req*', req.url, req.baseUrl, req.originalUrl, req.path);
    res.sendFile('dist/index.html', { root: root });
});
app.get('**', (req, res) => {
    console.log('req**', req.url, req.baseUrl, req.originalUrl, req.path);
    res.sendFile('dist/index.html', { root: root });
});
app.use(errorHandler);
function errorHandler(err, req, res, next) {
    console.log(err.message);
    const status = err && err.status ? err.status : 500;
    res.status(status).send(err.message);
}
exports.HTTP = httpServer.createServer(app);
exports.IO = socketIO(exports.HTTP);
const port = (+process.env.PORT) || 3000;
exports.HTTP.listen(port, () => console.log(`API running on port:${port}`));
tasks_1.JQueue.getJobCounts().then(jobs => console.log('JOBS:', jobs));
//# sourceMappingURL=index.js.map
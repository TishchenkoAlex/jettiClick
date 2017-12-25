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
const jwt_1 = require("./jwt");
const documents_1 = require("./routes/documents");
const registers_1 = require("./routes/registers");
const server_1 = require("./routes/server");
const suggest_1 = require("./routes/suggest");
const user_settings_1 = require("./routes/user.settings");
const utils_1 = require("./routes/utils");
const root = './';
const app = express();
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));
app.use('/liveness_check', (req, res, next) => res.json('OK'));
app.use('/api', jwt_1.jwtCheck, server_1.router);
app.use('/api', jwt_1.jwtCheck, documents_1.router);
app.use('/api', jwt_1.jwtCheck, user_settings_1.router);
app.use('/api', jwt_1.jwtCheck, suggest_1.router);
app.use('/api', jwt_1.jwtCheck, utils_1.router);
app.use('/api', jwt_1.jwtCheck, registers_1.router);
app.get('*', (req, res) => {
    res.sendFile('dist/index.html', { root: root });
});
app.use(errorHandler);
function errorHandler(err, req, res, next) {
    console.log(err.message);
    res.status(500).send(err.message);
}
exports.HTTP = httpServer.createServer(app);
exports.IO = socketIO(exports.HTTP);
const port = process.env.PORT || '3000';
exports.HTTP.listen(port, () => console.log(`API running on port:${port}`));
//# sourceMappingURL=index.js.map
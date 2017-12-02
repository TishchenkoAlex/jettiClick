"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// node_modules/typescript/bin/tsc -p ./src/server/ && node src/server/index.js
const bodyParser = require("body-parser");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const path = require("path");
const jwt_1 = require("./jwt");
const documents_1 = require("./routes/documents");
const user_settings_1 = require("./routes/user.settings");
const suggest_1 = require("./routes/suggest");
const utils_1 = require("./routes/utils");
const registers_1 = require("./routes/registers");
const root = './';
const app = express();
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));
app.use('/api', jwt_1.jwtCheck, documents_1.router);
app.use('/api', jwt_1.jwtCheck, user_settings_1.router);
app.use('/api', jwt_1.jwtCheck, suggest_1.router);
app.use('/api', jwt_1.jwtCheck, utils_1.router);
app.use('/api', jwt_1.jwtCheck, registers_1.router);
app.get('*', (req, res) => {
    res.sendFile('dist/index.html', { root: root });
});
const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`API running on localhost:${port}`));
//# sourceMappingURL=index.js.map
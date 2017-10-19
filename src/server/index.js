"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const path = require("path");
const jwt_1 = require("./jwt");
const routes_1 = require("./routes");
const root = './';
const app = express();
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));
app.use('/api', jwt_1.jwtCheck, routes_1.router);
app.get('*', (req, res) => {
    res.sendFile('dist/index.html', { root: root });
});
const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`API running on localhost:${port}`));
//# sourceMappingURL=index.js.map
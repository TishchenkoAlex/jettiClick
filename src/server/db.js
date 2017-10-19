"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgPromise = require("pg-promise");
const environment_1 = require("./env/environment");
const pgp = pgPromise({});
exports.db = pgp(environment_1.connString);
//# sourceMappingURL=db.js.map
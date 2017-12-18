"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgPromise = require("pg-promise");
const environment_1 = require("./env/environment");
const pgp = pgPromise({});
/* const types = pgp.pg.types;
const TIMESTAMPTZ_OID = 1184
const TIMESTAMP_OID = 1114
const parseFn = function(val) {
   return val === null ? null : val;
}
types.setTypeParser(TIMESTAMPTZ_OID, parseFn)
types.setTypeParser(TIMESTAMP_OID, parseFn)
 */
exports.db = pgp(environment_1.connString);
//# sourceMappingURL=db.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgPromise = require("pg-promise");
const pgp = pgPromise({});
pgp.pg.types.setTypeParser(1700, parseFloat);
pgp.pg.types.setTypeParser(20, parseInt);
//# sourceMappingURL=db.js.map
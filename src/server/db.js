"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgPromise = require("pg-promise");
const index_1 = require("./index");
const environment_1 = require("./env/environment");
const pgp = pgPromise({});
exports.db = pgp(environment_1.connString);
exports.db.connect({ direct: true }).then(sco => {
    sco.client.on('notification', data => {
        if (data.channel === 'addedrecord') {
            index_1.IO.emit('sql', data.payload);
        }
    });
    return sco.none('LISTEN $1~', 'addedrecord');
}).catch(error => {
    console.log('Error on static connection for sockets:', error);
});
//# sourceMappingURL=db.js.map
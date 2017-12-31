"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgPromise = require("pg-promise");
const index_1 = require("./index");
const environment_1 = require("./env/environment");
const pgp = pgPromise({});
pgp.pg.types.setTypeParser(1700, parseFloat);
pgp.pg.types.setTypeParser(20, parseInt);
exports.db = pgp(environment_1.connString);
const channel = 'event';
exports.db.connect({ direct: true }).then(sco => {
    sco.client.on('notification', data => {
        if (data.channel === channel) {
            index_1.IO.emit(channel, JSON.parse(data.payload));
        }
    });
    return sco.none('LISTEN $1~', channel);
}).catch(error => {
    console.log('Error on static connection for sockets:', error);
});
//# sourceMappingURL=db.js.map
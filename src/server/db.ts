import { IDatabase, IMain, ITask } from 'pg-promise';
import * as pgPromise from 'pg-promise';

import { IO } from '.';
import { accountDB, connString } from './env/environment';

const pgp: IMain = pgPromise({});
pgp.pg.types.setTypeParser(1700, parseFloat);
pgp.pg.types.setTypeParser(20, parseInt);

export const db: IDatabase<any> = pgp(connString);
export const ADB: IDatabase<any> = pgp(accountDB);

const channel = 'event';

db.connect({ direct: true }).then(sco => {
  sco.client.on('notification', data => {
    if (data.channel === channel) { IO.emit(channel, JSON.parse(data.payload)); }
  });
  return sco.none('LISTEN $1~', channel);
}).catch(error => {
  console.log('Error on static connection for sockets:', error);
});


export type TX = ITask<any> | IDatabase<any>;


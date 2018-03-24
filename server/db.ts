import { MSSQL } from './mssql';

/* export const db: IDatabase<any> = pgp(connString);
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
 */

export type TX = MSSQL;


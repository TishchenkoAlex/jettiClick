import { IDatabase, IMain, ITask } from 'pg-promise';
import * as pgPromise from 'pg-promise';
import { IO } from './index';

import { connString } from './env/environment';

const pgp: IMain = pgPromise({});
export const db: IDatabase<any> = pgp(connString);

db.connect({ direct: true }).then(sco => {
  sco.client.on('notification', data => {
    if (data.channel === 'addedrecord') {
      IO.emit('sql', data.payload)
    }
  });
  return sco.none('LISTEN $1~', 'addedrecord');
}).catch(error => {
  console.log('Error on static connection for sockets:', error);
})

export type TX = ITask<any> | IDatabase<any>;

import { IDatabase, IMain, ITask } from 'pg-promise';
import * as pgPromise from 'pg-promise';
import * as moment from 'moment';


import { connString } from './env/environment';

const pgp: IMain = pgPromise({});

/* const types = pgp.pg.types;
const TIMESTAMPTZ_OID = 1184
const TIMESTAMP_OID = 1114
const parseFn = function(val) {
   return val === null ? null : val;
}
types.setTypeParser(TIMESTAMPTZ_OID, parseFn)
types.setTypeParser(TIMESTAMP_OID, parseFn)
 */
export const db: IDatabase<any> = pgp(connString);

export type TX = ITask<any> | IDatabase<any>;

import { IDatabase, IMain, ITask } from 'pg-promise';
import * as pgPromise from 'pg-promise';
import * as moment from 'moment';


import { connString } from './env/environment';

const pgp: IMain = pgPromise({});

export const db: IDatabase<any> = pgp(connString);

export type TX = ITask<any> | IDatabase<any>;

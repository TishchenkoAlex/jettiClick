import { IDatabase, IMain } from 'pg-promise';
import * as pgPromise from 'pg-promise';

import { connString } from './env/environment';

const pgp: IMain = pgPromise({});
export const db: IDatabase<any> = pgp(connString);

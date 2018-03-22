import * as sql from 'mssql';
import * as driver from 'tedious';

import { sqlConfig, sqlConfigAccounts } from './env/environment';

export class MSSQL {
  private POOL: sql.ConnectionPool | sql.Transaction;
  attemtToReconect = 3;

  constructor(private config, private transaction?: sql.Transaction) {
    if (transaction) {
      this.POOL = transaction;
    } else {
      this.POOL = new sql.ConnectionPool(this.config);
      this.POOL.connect().catch(err => {
        if (this.attemtToReconect-- > 0) {
          (<sql.ConnectionPool>this.POOL).close()
          .then(() => (<sql.ConnectionPool>this.POOL).connect())
          .catch(() => (<sql.ConnectionPool>this.POOL).connect());
        } else {
          process.exit(-1);
        }
      });
    }
  }

  connect() {
    return (<sql.ConnectionPool>this.POOL).connect();
  }

  close() {
    return (<sql.ConnectionPool>this.POOL).close();
  }

  async manyOrNone<T>(text: string, params: any[] = []): Promise<T[]> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES;`);
    let data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    data = data ? JSON.parse(data) : [];
    return data;
  }

  async oneOrNone<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES ;`);
    let data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    data = data ? JSON.parse(data) : null;
    return data ? data[0] : data;
  }

  async none<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(text);
    const data = response && response.recordset ? response.recordset[0] : null;
    return data;
  }

  async tx<T>(func: (tx: MSSQL) => Promise<T>) {
    const transaction = new sql.Transaction(<any>this.POOL);
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    try {
      await func(new MSSQL(this.config, transaction));
      await transaction.commit();
    } catch (err) {
      console.log('SQL: error', err);
      try {
        await transaction.rollback();
      } catch {
        console.log('SQL: ROLLBACK error', err);
      }
      throw new Error(err);
    }
  }

}

export const sdb = new MSSQL(sqlConfig);
export const sdbq = new MSSQL({ ...sqlConfig, requestTimeout: 1000 * 60 * 60 });
export const sdba = new MSSQL(sqlConfigAccounts);


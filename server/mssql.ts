import * as sql from 'mssql';
import * as driver from 'tedious';

import { sqlConfig, sqlConfigAccounts } from './env/environment';

export class MSSQL {
  private POOL: sql.ConnectionPool | sql.Transaction;
  attemtToReconect = 10;

  constructor(private config, private transaction?: sql.Transaction) {
    if (transaction) {
      this.POOL = transaction;
    } else {
      this.POOL = new sql.ConnectionPool(this.config);
      this.connect()
      .then(() => console.log('connected', this.config))
      .catch(err => console.log('connection error', err));
      setImmediate(() => {
        this.connect()
          .then(() => console.log('connected', this.config))
          .catch(err => {});
      }, 30000);
    }
  }

  async connect() {
    try { await this.close(); } catch { }
    await (<sql.ConnectionPool>this.POOL).connect();
    this.attemtToReconect = 10;
    return this;
  }

  async close() {
    try { await (<sql.ConnectionPool>this.POOL).close(); } catch { }
    return this;
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
    data = data ? data[0] : data;
    if (data && typeof data.doc === 'string') data.doc = JSON.parse(data.doc);
    return data;
  }

  async none<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(text);
    const data = response && response.recordset ? response.recordset[0] : null;
    if (data && typeof data.doc === 'string') data.doc = JSON.parse(data.doc);
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


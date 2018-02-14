import * as sql from 'mssql';

import { sqlConfig, sqlConfigAccounts } from './env/environment';

export class MSSQL {
  private pool: sql.ConnectionPool | sql.Transaction;

  constructor(private config, private transaction?: sql.Transaction) {
    if (transaction) {
      this.pool = transaction;
    } else {
      new sql.ConnectionPool(config)
        .connect()
        .then(p => this.pool = p)
        .catch(err => console.log('Connection error'));
    }
  }

  async manyOrNone<T>(text: string, params: any[] = []): Promise<T[]> {
    const request = new sql.Request(<any>(this.pool));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES;`);
    let data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    data = data ? JSON.parse(data) : [];
    return data;
  }

  async oneOrNone<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.pool));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES ;`);
    let data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    data = data ? JSON.parse(data) : null;
    return data ? data[0] : data;
  }

  async none<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.pool));
    for (let i = 0; i < params.length; i++) {
      request.input(`p${i + 1}`, params[i]);
    }
    const response = await request.query(text);
    const data = response && response.recordset ? response.recordset[0] : null;
    return data;
  }

  async tx<T>(func: (tx: MSSQL) => Promise<T>) {
    const transaction = new sql.Transaction(<any>this.pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SNAPSHOT);
    try {
      await func(new MSSQL(null, transaction));
      await transaction.commit();
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

}

export const sdb = new MSSQL(sqlConfig);
export const sdba = new MSSQL(sqlConfigAccounts);

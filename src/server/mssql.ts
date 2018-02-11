import * as sql from 'mssql';

import { sqlConfig } from './env/environment';

const pool = new sql.ConnectionPool(sqlConfig);

// tslint:disable-next-line:class-name
export class sdb {

  static async manyOrNone<T>(text: string, params: { name: string, value: any }[] = []): Promise<T[]> {
    if (!pool.connected) { await pool.connect(); }
    const request = new sql.Request(pool);
    for (const param of params) {
      request.input(param.name, param.value);
    }
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES;`);
    let data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    data = data ? JSON.parse(data) : [];
    return data;
  }

  static async oneOrNone<T>(text: string, params: { name: string, value: any }[] = []): Promise<T> {
    if (!pool.connected) { await pool.connect(); }
    const request = new sql.Request(pool);
    for (const param of params) {
      request.input(param.name, param.value || null);
    }
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES ;`);
    let data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    data = data ? JSON.parse(data) : null;
    return data ? data[0] : data;
  }

}



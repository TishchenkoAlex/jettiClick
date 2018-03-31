import * as sql from 'mssql';
import { sqlConfig, sqlConfigAccounts } from './env/environment';
import { dateReviver } from './fuctions/dateReviver';

export class MSSQL {
  private POOL: sql.ConnectionPool | sql.Transaction;

  constructor(private config, private transaction?: sql.Transaction) {
    if (transaction) this.POOL = transaction; else {
      this.POOL = new sql.ConnectionPool(this.config);
      this.connect()
        .then(() => console.log('connected', this.config.database))
        .catch(err => console.log('connection error', err));

      if (process.env.NODE_ENV === 'production')
        setInterval(() => {
          (<sql.ConnectionPool>this.POOL).connect()
            .then(() => console.log('reconnected', this.config.database))
            .catch();
        }, 60000);
    }
  }

  async connect() {
    try { await this.close(); } catch { }
    await (<sql.ConnectionPool>this.POOL).connect();
    return this;
  }

  async close() {
    try { await (<sql.ConnectionPool>this.POOL).close(); } catch { }
    return this;
  }

  async manyOrNone<T>(text: string, params: any[] = []): Promise<T[]> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) request.input(`p${i + 1}`, params[i]);
    const response = await request.query(`${text}`);
    const data = response.recordset;
    const result = data.map(el => {
      const row = {};
      for (const k of Object.keys(el)) {
        if (k.indexOf('.id') > -1) {
          const key = k.split('.id')[0];
          row[key] = { id: el[key + '.id'], type: el[key + '.type'], value: el[key + '.value'] };
        } else {
          if (k.indexOf('.type') > -1 || k.indexOf('.value') > -1 || k.indexOf('.code') > -1) continue;
          if (typeof el[k] === 'string' && el[k][0] === '{' && el[k][el[k].length - 1] === '}')
            row[k] = JSON.parse(el[k]); else row[k] = el[k];
        }
      }
      return row as T;
    });
    return result || [];
  }

  async manyOrNoneJSON<T>(text: string, params: any[] = []): Promise<T[]> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) request.input(`p${i + 1}`, params[i]);
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES;`);
    const data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    return data ? JSON.parse(data) : [];
  }

  async oneOrNone<T>(text: string, params: any[] = []): Promise<T | null> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) request.input(`p${i + 1}`, params[i]);
    const response = await request.query(`${text}`);
    const data = response.recordset;
    const map = data.map(el => {
      const row = {};
      for (const k of Object.keys(el)) {
        if (k.indexOf('.id') !== -1) {
          const key = k.split('.id')[0];
          row[key] = { id: el[key + '.id'], type: el[key + '.type'], value: el[key + '.value'] };
        } else {
          if (k.indexOf('.type') !== -1 || k.indexOf('.value') !== -1) continue;
          row[k] = el[k];
        }
      }
      return row as T;
    });
    const result = map && map[0] || null;
    if (result && typeof result['doc'] === 'string') result['doc'] = JSON.parse(result['doc']);
    if (result && typeof result['data'] === 'string') result['data'] = JSON.parse(result['data']);
    return result;
  }

  async oneOrNoneJSON<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) request.input(`p${i + 1}`, params[i]);
    const response = await request.query(`${text} FOR JSON PATH, WITHOUT_ARRAY_WRAPPER ,INCLUDE_NULL_VALUES ;`);
    const data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    const result = typeof data === 'string' ? JSON.parse(data) : null;
    if (result && typeof result.doc === 'string') result.doc = JSON.parse(result.doc);
    if (result && typeof result.data === 'string') result.data = JSON.parse(result.data);
    return result;
  }

  async none<T>(text: string, params: any[] = []): Promise<T | T[] | null> {
    const request = new sql.Request(<any>(this.POOL));
    for (let i = 0; i < params.length; i++) request.input(`p${i + 1}`, params[i]);
    const response = await request.query(text);
    const data = response && response.recordset ? response.recordset : null;
    if (data && data.length === 1) {
      if (typeof data[0].doc === 'string') data[0].doc = JSON.parse(data[0].doc);
      if (typeof data[0].data === 'string') data[0].data = JSON.parse(data[0].data);
      return data[0];
    }
    if (data && data.length > 1) {
      data.forEach(el => {
        if (typeof el.doc === 'string') el.doc = JSON.parse(el.doc);
        if (typeof el.data === 'string') el.data = JSON.parse(el.data);
      });
      return data;
    }
    return data || null;
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

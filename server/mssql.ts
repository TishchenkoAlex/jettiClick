import * as sql from 'mssql';
import { sqlConfig, sqlConfigAccounts } from './env/environment';
import { dateReviver } from './fuctions/dateReviver';
import { lib } from './std.lib';
import { TYPES } from 'mssql';

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

  private ToJSON(value: any): any {
    if (typeof value === 'string' &&
      (value[0] === '{' || (value[0] === '[')) &&
      (value[value.length - 1] === '}' || (value[value.length - 1] === ']')))
      try { return JSON.parse(value, dateReviver); } catch { return value; }
    else
      return value;
  }

  private complexObject<T>(data: any) {
    if (!data) return data;
    const row: T = Object.assign({});
    // tslint:disable-next-line:forin
    for (const k in data) {
      const value = this.ToJSON(data[k]);
      if (k.includes('.')) {
        const keys = k.split('.');
        row[keys[0]] = { ...row[keys[0]], [keys[1]]: value };
      } else
        row[k] = value;
    }
    return row;
  }

  private setParams(params: any[], request: sql.Request) {
    for (let i = 0; i < params.length; i++) {
      if (params[i] instanceof Date) {
        request.input(`p${i + 1}`, sql.DateTimeOffset, params[i]);
      } else
        request.input(`p${i + 1}`, params[i]);
    }
  }

  async oneOrNone<T>(text: string, params: any[] = []): Promise<T | null> {
    const request = new sql.Request(<any>(this.POOL));
    this.setParams(params, request);
    const response = await request.query(`${text}`);
    return response.recordset.length ? this.complexObject<T>(response.recordset[0]) : null;
  }


  async manyOrNone<T>(text: string, params: any[] = []): Promise<T[]> {
    const request = new sql.Request(<any>(this.POOL));
    this.setParams(params, request);
    const response = await request.query(`${text}`);
    return response.recordset.map(el => this.complexObject<T>(el)) || [];
  }

  async manyOrNoneJSON<T>(text: string, params: any[] = []): Promise<T[]> {
    const request = new sql.Request(<any>(this.POOL));
    this.setParams(params, request);
    const response = await request.query(`${text} FOR JSON PATH, INCLUDE_NULL_VALUES;`);
    const data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    return data ? JSON.parse(data, dateReviver) : [];
  }

  async oneOrNoneJSON<T>(text: string, params: any[] = []): Promise<T> {
    const request = new sql.Request(<any>(this.POOL));
    this.setParams(params, request);
    const response = await request.query(`${text} FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES ;`);
    const data = response.recordset[0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'];
    const result = typeof data === 'string' ? JSON.parse(data) : null;
    if (result && typeof result.doc === 'string') result.doc = JSON.parse(result.doc, dateReviver);
    if (result && typeof result.data === 'string') result.data = JSON.parse(result.data, dateReviver);
    return result;
  }

  async none<T>(text: string, params: any[] = []) {
    const request = new sql.Request(<any>(this.POOL));
    this.setParams(params, request);
    await request.query(text);
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

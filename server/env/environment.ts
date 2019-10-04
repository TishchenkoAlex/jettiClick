import { config } from 'mssql';

export const DB_NAME = process.env.DB_NAME || 'sm';
export const REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
export const JTW_KEY = process.env.JTW_KEY || 'Pa5315word';

const DB_PORT = isNaN(parseInt(process.env.DB_PORT as string, undefined)) ?
  1433 : 1433; // parseInt(process.env.DB_PORT as string, undefined);

export const sqlConfig: config = {
  server: '35.204.31.43', // process.env.DB_HOST || '35.204.31.43', // sql.jetti-app.com
  port: DB_PORT,
  database: DB_NAME,
  user: process.env.DB_USER || 'yuralex',
  password: process.env.DB_PASSWORD || 'MyNew01Password',
  requestTimeout: 1000 * 120,
  pool: { min: 25, max: 10000/* , acquireTimeoutMillis: 0 */ },
  options: { encrypt: false }
};

export const sqlConfigAccounts: config = {
  server: process.env.DB_ACCOUNTS_HOST || '35.204.31.43',
  port: DB_PORT,
  database: process.env.DB_ACCOUNTS_NAME || 'accounts',
  user: process.env.DB_ACCOUNTS_USER || 'yuralex',
  password: process.env.DB_ACCOUNTS_PASSWORD || 'MyNew01Password',
  requestTimeout: 1000 * 120,
  pool: { min: 25, max: 10000/* , acquireTimeoutMillis: 0 */ },
  options: { encrypt: false }
};

import { config } from 'mssql';

export const DB_NAME = process.env.DB_NAME || 'jetti-app';
export const REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
export const JTW_KEY = process.env.JTW_KEY || 'Pa5315word';

export const sqlConfig: config = {
  server: process.env.DB_HOST || 'sql.jetti-app.com',
  port: 14330,
  database: DB_NAME,
  user: process.env.DB_USER || 'yuralex',
  password: process.env.DB_PASSWORD || 'MyNew01Password',
  requestTimeout: 1000 * 120,
  pool: {
    min: 25,
    max: 10000,
  },
  options: {
    encrypt: false,
  }
};

export const sqlConfigAccounts: config = {
  server: process.env.DB_ACCOUNTS_HOST || 'sql.jetti-app.com',
  port: 14330,
  database: process.env.DB_ACCOUNTS_NAME || 'accounts',
  user: process.env.DB_ACCOUNTS_USER || 'yuralex',
  password: process.env.DB_ACCOUNTS_PASSWORD || 'MyNew01Password',
  requestTimeout: 1000 * 120,
  pool: {
    min: 25,
    max: 10000,
  },
  options: {
    encrypt: false,
  }
};

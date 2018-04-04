import { config } from 'mssql';

export const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
export const REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
export const REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
export const JTW_KEY = process.env.JTW_KEY || 'Pa5315word';

export const sqlConfig: config = {
  database: process.env.DB_NAME || 'bcg',
  server: process.env.DB_HOST || '35.198.154.104',
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
  database: process.env.DB_ACCOUNTS_NAME || 'accounts',
  server: process.env.DB_ACCOUNTS_HOST || '35.198.154.104',
  user: process.env.DB_ACCOUNTS_USER || 'yuralex',
  password: process.env.DB_ACCOUNTS_PASSWORD || 'MyNew01Password',
  options: {
    useUTC: false,
    encrypt: false,
  }
};

import { config } from 'mssql';

export const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
export const REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
export const REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
export const JTW_KEY = process.env.JTW_KEY || 'Pa5315word';

export const connString_MSSQL = {
  server: process.env.DB_HOST || 'jetti.database.windows.net',
  userName: process.env.DB_USER || 'yuralex',
  password: process.env.DB_PASSWORD || 'MyNew01Password',
  options: {
    encrypt: true,
    database: process.env.DB_NAME || 'big',
  }
};

export const sqlConfig: config = {
  database: process.env.DB_NAME || 'big',
  server: process.env.DB_HOST || 'jetti.database.windows.net',
  user: process.env.DB_USER || 'yuralex',
  password: process.env.DB_PASSWORD || 'MyNew01Password',
  pool: {
    min: 2,
    max: 20,
  },
  options: {
    encrypt: true,
  }
};

export const sqlConfigAccounts: config = {
  database: process.env.DB_ACCOUNTS_NAME || 'accounts',
  server: process.env.DB_ACCOUNTS_HOST || 'jetti.database.windows.net',
  user: process.env.DB_ACCOUNTS_USER || 'yuralex',
  password: process.env.DB_ACCOUNTS_PASSWORD || 'MyNew01Password',
  options: {
    encrypt: true,
  }
};

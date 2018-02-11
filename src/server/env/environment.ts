import { config } from 'mssql';

const PG_DEV_SERVER = '35.198.118.153';
export const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
export const REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
export const REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
export const JTW_KEY =  process.env.JTW_KEY || 'Pa5315word';

export const connString = {
  host: process.env.POSTGRES_DB_JETTI_HOST ? process.env.POSTGRES_DB_JETTI_HOST.split(':')[0] : PG_DEV_SERVER,
  database: process.env.POSTGRES_DB_NAME || 'jetti',
  user: process.env.POSTGRES_DB_USER || 'postgres',
  password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
  poolSize: 100,
  statement_timeout: 1000 * 20,
};

export const accountDB = {
  host: process.env.POSTGRES_DB_ACCOUNTS_HOST ? process.env.POSTGRES_DB_ACCOUNTS_HOST.split(':')[0] : PG_DEV_SERVER,
  database: 'accounts',
  user: process.env.POSTGRES_DB_USER || 'postgres',
  password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
  statement_timeout: 1000 * 20,
};

export const connString_MSSQL = {
  server: process.env.DB_HOST || 'jetti.database.windows.net',
  userName: process.env.DB_USER || 'yuralex',
  password: process.env.DB_PASSWORD || 'MyNew01Password',
  options: {
    encrypt: true,
    database: process.env.DB_NAME || 'jetti-app',
  }
};

export const sqlConfig: config = {
  database: process.env.DB_NAME || 'jetti-app',
  server: process.env.DB_HOST || 'jetti.database.windows.net',
  user: process.env.DB_USER || 'yuralex',
  password: process.env.DB_PASSWORD || 'MyNew01Password',
  pool: {
    min: 20,
    max: 100,
  },
  options: {
    encrypt: true,
  }
};

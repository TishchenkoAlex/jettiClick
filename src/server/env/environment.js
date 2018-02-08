"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PG_DEV_SERVER = '35.198.118.153';
exports.SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
exports.REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
exports.REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
exports.JTW_KEY = process.env.JTW_KEY || 'Pa$$word';
exports.connString = {
    host: process.env.POSTGRES_DB_JETTI_HOST ? process.env.POSTGRES_DB_JETTI_HOST.split(':')[0] : PG_DEV_SERVER,
    database: process.env.SUBSCRIPTION_ID || 'jetti',
    user: process.env.POSTGRES_DB_USER || 'postgres',
    password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
    poolSize: 100,
    statement_timeout: 1000 * 60 * 2,
};
exports.accountDB = {
    host: process.env.POSTGRES_DB_ACCOUNTS_HOST ? process.env.POSTGRES_DB_ACCOUNTS_HOST.split(':')[0] : PG_DEV_SERVER,
    database: 'accounts',
    user: process.env.POSTGRES_DB_USER || 'postgres',
    password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
    statement_timeout: 1000 * 60 * 2,
};
//# sourceMappingURL=environment.js.map
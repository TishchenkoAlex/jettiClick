"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PG_DEV_SERVER = '35.198.118.153';
exports.connString = {
    host: process.env.POSTGRES_DB_HOST ? process.env.POSTGRES_DB_HOST.split(':')[0] : PG_DEV_SERVER,
    database: 'jetti',
    user: process.env.POSTGRES_DB_USER || 'postgres',
    password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
    poolSize: 50,
};
exports.accountDB = {
    host: process.env.POSTGRES_DB_HOST ? process.env.POSTGRES_DB_HOST.split(':')[0] : PG_DEV_SERVER,
    database: 'accounts',
    user: process.env.POSTGRES_DB_USER || 'postgres',
    password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
};
exports.REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
exports.REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
exports.JTW_KEY = process.env.JTW_KEY || 'MyNew01Password';
//# sourceMappingURL=environment.js.map
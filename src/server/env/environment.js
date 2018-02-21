"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
exports.REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
exports.REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
exports.JTW_KEY = process.env.JTW_KEY || 'Pa5315word';
exports.connString_MSSQL = {
    server: process.env.DB_HOST || 'jetti.database.windows.net',
    userName: process.env.DB_USER || 'yuralex',
    password: process.env.DB_PASSWORD || 'MyNew01Password',
    options: {
        encrypt: true,
        database: process.env.DB_NAME || 'big',
    }
};
exports.sqlConfig = {
    database: process.env.DB_NAME || 'big',
    server: process.env.DB_HOST || 'jetti.database.windows.net',
    user: process.env.DB_USER || 'yuralex',
    password: process.env.DB_PASSWORD || 'MyNew01Password',
    requestTimeout: 1000 * 60 * 2,
    pool: {
        min: 2,
        max: 500,
    },
    options: {
        encrypt: true,
    }
};
exports.sqlConfigAccounts = {
    database: process.env.DB_ACCOUNTS_NAME || 'accounts',
    server: process.env.DB_ACCOUNTS_HOST || 'jetti.database.windows.net',
    user: process.env.DB_ACCOUNTS_USER || 'yuralex',
    password: process.env.DB_ACCOUNTS_PASSWORD || 'MyNew01Password',
    options: {
        encrypt: true,
    }
};
//# sourceMappingURL=environment.js.map
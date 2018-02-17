"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
exports.REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
exports.REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
exports.JTW_KEY = process.env.JTW_KEY || 'Pa5315word';
exports.connString_MSSQL = {
    server: process.env.DB_HOST || 'db.jetti-app.com',
    userName: process.env.DB_USER || 'jetti-app',
    password: process.env.DB_PASSWORD || 'Pa$$word',
    options: {
        encrypt: true,
        database: process.env.DB_NAME || 'jetti-app',
    }
};
exports.sqlConfig = {
    database: process.env.DB_NAME || 'jettibig',
    server: process.env.DB_HOST || 'db.jetti-app.com',
    user: process.env.DB_USER || 'jetti-app',
    password: process.env.DB_PASSWORD || 'Pa$$word',
    connectionTimeout: 1000 * 60 * 2,
    requestTimeout: 1000 * 60 * 2,
    pool: {
        min: 25,
        max: 500,
    },
    options: {
        encrypt: true,
    }
};
exports.sqlConfigAccounts = {
    database: process.env.DB_ACCOUNTS_NAME || 'accounts',
    server: process.env.DB_ACCOUNTS_HOST || 'db.jetti-app.com',
    user: process.env.DB_ACCOUNTS_USER || 'jetti-app',
    password: process.env.DB_ACCOUNTS_PASSWORD || 'Pa$$word',
    options: {
        encrypt: true,
    }
};
//# sourceMappingURL=environment.js.map
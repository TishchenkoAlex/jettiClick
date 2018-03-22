"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID ? '/' + process.env.SUBSCRIPTION_ID : '';
exports.REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
exports.REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
exports.JTW_KEY = process.env.JTW_KEY || 'Pa5315word';
exports.sqlConfig = {
    database: process.env.DB_NAME || 'jetti-app',
    server: process.env.DB_HOST || '35.198.154.104',
    user: process.env.DB_USER || 'yuralex',
    password: process.env.DB_PASSWORD || 'MyNew01Password',
    requestTimeout: 1000 * 120,
    pool: {
        min: 20,
        max: 500,
    },
    options: {
        encrypt: false,
    }
};
exports.sqlConfigAccounts = {
    database: process.env.DB_ACCOUNTS_NAME || 'accounts',
    server: process.env.DB_ACCOUNTS_HOST || '35.198.154.104',
    user: process.env.DB_ACCOUNTS_USER || 'yuralex',
    password: process.env.DB_ACCOUNTS_PASSWORD || 'MyNew01Password',
    options: {
        encrypt: false,
    }
};
//# sourceMappingURL=environment.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connString = {
    host: process.env.POSTGRES_DB_HOST ? process.env.POSTGRES_DB_HOST.split(':')[0] : '35.198.118.153',
    database: 'jetti',
    user: process.env.POSTGRES_DB_USER || 'postgres',
    password: process.env.POSTGRES_DB_PASSWORD || 'Pa$$word',
    poolSize: 50,
};
exports.REDIS_DB_HOST = process.env.REDIS_DB_HOST || '127.0.0.1';
exports.REDIS_DB_PREFIX = process.env.REDIS_DB_PREFIX || 'bull';
exports.JwtConfig = {
    JwtSecret: {
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://jetti-app.auth0.com/.well-known/jwks.json'
    },
    audience: 'https://jetti-app.com/api',
    issuer: 'https://jetti-app.auth0.com/',
    algorithms: ['RS256']
};
//# sourceMappingURL=environment.js.map
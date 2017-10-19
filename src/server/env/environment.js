"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connString = 'postgres://postgres:Pa$$word@db.jetti-app.com/jetti';
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
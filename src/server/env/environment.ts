export const connString = 'postgres://postgres:Pa$$word@35.198.136.168/jetti';
export const JwtConfig = {
  JwtSecret: {
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://jetti-app.auth0.com/.well-known/jwks.json'
  },
  audience: 'https://jetti-app.com/api',
  issuer: 'https://jetti-app.auth0.com/',
  algorithms: ['RS256']
}



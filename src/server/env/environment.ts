export const connString = {
  host: '35.198.118.153',
  database: 'jetti',
  user: 'postgres',
  password: 'Pa$$word',
  poolSize: 50,
}
// db.jetti-app.com
// 35.198.118.153

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


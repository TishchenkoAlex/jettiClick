const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');

const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://jetti-app.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://jetti-app.com/api',
  issuer: 'https://jetti-app.auth0.com/',
  algorithms: ['RS256']
});

const routes = require('./routes');

const root = './';
const app = express();

app.use(compression());
app.use(cors());
app.use(jwtCheck);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));
app.use('/api', routes);
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: root });
});

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`API running on localhost:${port}`));

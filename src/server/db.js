const pgp = require('pg-promise')();

const env = require('./env/environment');

const db = pgp(env.connString);

module.exports = db;

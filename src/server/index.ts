// node_modules/typescript/bin/tsc -p ./src/server/ && node src/server/index.js
import 'reflect-metadata';

import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as tediousExpress from 'express4-tedious';
import * as httpServer from 'http';
import * as path from 'path';
import * as socketIO from 'socket.io';

import { connString, connString_MSSQL, SUBSCRIPTION_ID } from './env/environment';
import { JQueue } from './models/Tasks/tasks';
import { router as auth } from './routes/auth';
import { router as documents } from './routes/documents';
import { authHTTP, authIO } from './routes/middleware/check-auth';
import { router as registers } from './routes/registers';
import { router as server } from './routes/server';
import { router as suggests } from './routes/suggest';
import { router as tasks } from './routes/tasks';
import { router as userSettings } from './routes/user.settings';
import { router as utils } from './routes/utils';
import { configSchema } from './models/config';

const root = './';
const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'dist')));

app.use(function (req, res, next) {
  res.type('application/json');
  req['sql'] = tediousExpress(connString_MSSQL);
  next();
});

app.use('/liveness_check', (req: Request & { sql: any }, res: Response, next: NextFunction) => {
  req.sql(`
    select top 10
    id, type, parent, date, code, description,
    posted, deleted, isfolder, company, [user], info, timestamp,
    JSON_QUERY(doc) doc from Documents for JSON PATH, INCLUDE_NULL_VALUES`)
    .into(res);
});

console.log('SUBSCRIPTION_ID', SUBSCRIPTION_ID, `${SUBSCRIPTION_ID}/api`);
const api = `${SUBSCRIPTION_ID}/api`;
app.use(api, authHTTP, server);
app.use(api, authHTTP, documents);
app.use(api, authHTTP, userSettings);
app.use(api, authHTTP, suggests);
app.use(api, authHTTP, utils);
app.use(api, authHTTP, registers);
app.use(api, authHTTP, tasks);
app.use(`${SUBSCRIPTION_ID}/auth`, auth);
app.use('/auth', auth);



app.get('*', (req: Request, res: Response) => {
  res.sendFile('dist/index.html', { root: root });
});

app.use(errorHandler);
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.log(err.message);
  const status = err && (err as any).status ? (err as any).status : 500;
  res.status(status).send(err.message);
}

export const HTTP = httpServer.createServer(app);
export const IO = socketIO(HTTP, { path: SUBSCRIPTION_ID + '/socket.io' });
IO.use(authIO);

const port = (+process.env.PORT) || 3000;
HTTP.listen(port, () => console.log(`API running on port:${port}`));
JQueue.getJobCounts().then(jobs => console.log('JOBS:', jobs));
console.log(configSchema.get('Document.Invoice').QueryObject);



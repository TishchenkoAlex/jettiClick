// node_modules/typescript/bin/tsc -p ./src/server/ && node src/server/index.js
import 'reflect-metadata';

import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as httpServer from 'http';
import * as path from 'path';
import * as socketIO from 'socket.io';

import { JQueue } from './models/Tasks/tasks';
import { router as auth } from './routes/auth';
import { router as documents } from './routes/documents';
import checkAuth from './routes/middleware/check-auth';
import { router as registers } from './routes/registers';
import { router as server } from './routes/server';
import { router as suggests } from './routes/suggest';
import { router as tasks } from './routes/tasks';
import { router as userSettings } from './routes/user.settings';
import { router as utils } from './routes/utils';

const root = './';
const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(root, 'dist')));
app.use('/liveness_check', (req: Request, res: Response, next: NextFunction) => res.json('OK'));

app.use('/api', checkAuth, server);
app.use('/api', checkAuth, documents);
app.use('/api', checkAuth, userSettings);
app.use('/api', checkAuth, suggests);
app.use('/api', checkAuth, utils);
app.use('/api', checkAuth, registers);
app.use('/api', checkAuth, tasks);
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
export const IO = socketIO(HTTP);

const port = (+process.env.PORT) || 3000;
HTTP.listen(port, () => console.log(`API running on port:${port}`));
JQueue.getJobCounts().then(jobs => console.log('JOBS:', jobs));

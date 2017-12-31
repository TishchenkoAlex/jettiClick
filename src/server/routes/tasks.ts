import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import { IJettiTask } from '../models/api';
import { User } from '../routes/user.settings';

export const router = express.Router();

router.get('/task/latest', async (req: Request, res: Response, next: NextFunction) => {
  let result: IJettiTask[];
  try {
    result = await db.manyOrNone(`
      SELECT * FROM "tasks" WHERE "user" = $1 ORDER BY status, "startedAt" desc LIMIT 10`, [User(req)]);
    res.json(result);
  } catch (err) { next(err); }
})

router.post('/task/start', async (req: Request, res: Response, next: NextFunction) => {
  const task = req.body as IJettiTask;
  let result: IJettiTask;
  try {
    result = await db.one(`
      INSERT INTO "tasks" (name, description, url, "user")
      VALUES($1, $2, $3, $4) RETURNING *;`, [task.name, task.description, task.url, User(req)]
    );
    res.json(result);
  } catch (err) { next(err); }
})

export function updateTask(id: number, progress: number) {
  return db.none(`
    UPDATE "tasks" SET progress = $1 WHERE id = $2`, [process, id]);
}

export function createTask(task: IJettiTask) {
  return db.one(`
    INSERT INTO "tasks" (name, description, url, "user")
    VALUES($1, $2, $3, $4) RETURNING *;`, [task.name, task.description, task.url, task.user]);
}

router.post('/task/complete/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
  } catch (err) { next(err); }
})

/* setTimeout(() => {
  const socket = socketIOClient('http://localhost:3000');
  socket.on('task', data => console.log('client task', data))
}, 1000);
 */
/* setTimeout(() => {
IO.on('connection', s => {
  console.log('conncet');
  s.on('task', data => console.log('task', data))
})}, 1)
 */


import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { db } from '../db';
import { IJettiTask } from '../models/api';
import { JQueue, mapJob } from '../models/Tasks/tasks';
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

router.post('/jobs/add', async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.data.userId = req.user.sub;
    req.body.data.user = User(req);
    const result = await JQueue.add(req.body.data, req.body.opts);
    res.json(mapJob(result));
  } catch (err) { next(err); }
})

router.get('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const all = await Promise.all([
      JQueue.getActive(),
      JQueue.getCompleted(),
      JQueue.getDelayed(),
      JQueue.getFailed(),
      JQueue.getRepeatableJobs()
    ]);
    const result = {
      Active: all[0].map(el => mapJob(el)),
      Completed: all[1].map(el => mapJob(el)),
      Delayed: all[2].map(el => mapJob(el)),
      Failed: all[3].map(el => mapJob(el)),
      RepeatableJobs: all[4],
    }
    result.Completed.length = Math.min(5, result.Completed.length);
    result.Delayed.length = Math.min(5, result.Delayed.length);
    result.Failed.length = Math.min(5, result.Failed.length);
    res.json(result);
  } catch (err) { next(err); }
})

router.get('/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await JQueue.getJob(req.params.id);
    res.json(mapJob(job));
  } catch (err) { next(err); }
})


import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { db, TX } from '../db';
import { IEvent } from '../models/api';
import { User } from '../routes/user.settings';

export const router = express.Router();

router.get('/event/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await db.multiResult(`
      SELECT COUNT(*) active FROM "events" WHERE "user" = $1 AND "endedAt" IS NULL;
      SELECT * FROM "events" WHERE "user" = $1 ORDER BY "endedAt" DESC, "startedAt" desc LIMIT 10`, [User(req)]);
    res.json({ active: data[0].rows[0].active, events: data[1].rows });
  } catch (err) { next(err); }
})

export class Events {

  static updateProgress(id: string, progress: number, endedAt: Date = null, err: string = null, tx: TX = db) {
    return tx.none(`
      UPDATE "events" SET progress = $2, "endedAt" = $3, error = $4 WHERE id = $1`, [id, progress, endedAt, err]);
  }

  static create(description: string, user: string, url: string = null, tx: TX = db): Promise<IEvent> {
    return tx.one<IEvent>(`
      INSERT INTO "events" (description, "user", url)
      VALUES($1, $2, $3) RETURNING *;`, [description, user, url]);
  }

}

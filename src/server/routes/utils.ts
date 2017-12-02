import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { db } from './../db';

export const router = express.Router();

router.get('/catalogs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await db.manyOrNone(`
        SELECT type, description, icon, menu FROM config_schema WHERE chapter = 'Catalog' ORDER BY description`));
  } catch (err) { next(err.message); }
})

router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await db.manyOrNone(`
        SELECT type, description, icon, menu FROM config_schema WHERE chapter = 'Document' ORDER BY description`));
  } catch (err) { next(err.message); }
})

router.get('/operations/groups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await db.manyOrNone(`
        SELECT id, type, description as value, code FROM "Documents" WHERE type = 'Catalog.Operation.Group' ORDER BY description`));
  } catch (err) { next(err.message); }
})

router.get('/:type/dimensions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result = await db.oneOrNone(`SELECT dimensions FROM config_schema WHERE type = $1`, [req.params.type]);
    if (result) { result = result.dimensions || [] } else { result = [] }
    res.json(result);
  } catch (err) { next(err.message); }
})

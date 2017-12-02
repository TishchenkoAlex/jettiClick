import { NextFunction, Request, Response } from 'express';
import * as express from 'express';

import { db } from './../db';

export const router = express.Router();

router.get('/register/account/movements/view/:id', async (req, res, next) => {
  try {
    const query = `SELECT * FROM "Register.Account.View" where document_id = $1`;
    const data = await db.manyOrNone(query, [req.params.id]);
    res.json(data);
  } catch (err) { next(err.message); }
})

router.get('/register/accumulation/list/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.manyOrNone(`
        SELECT DISTINCT r.type, s.description FROM "Register.Accumulation" r
        LEFT JOIN config_schema s ON s.type = r.type
        WHERE document = $1`, [req.params.id]);
    res.json(result);
  } catch (err) { next(err.message); }
})

router.get('/register/info/list/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.manyOrNone(`
        SELECT DISTINCT r.type, s.description FROM "Register.Info" r
        LEFT JOIN config_schema s ON s.type = r.type
        WHERE document = $1`, [req.params.id]);
    res.json(result);
  } catch (err) { next(err.message); }
})

router.get('/register/accumulation/:type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config_schema = await db.one(`
        SELECT "queryObject" query FROM config_schema WHERE type = $1`, [req.params.type]);
    const result = await db.manyOrNone(`${config_schema.query} AND r.document = $1`, [req.params.id]);
    res.json(result);
  } catch (err) { next(err.message); }
})


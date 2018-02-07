import { NextFunction, Request, Response } from 'express';
import * as express from 'express';

import { db } from './../db';
import { createRegisterAccumulation } from '../models/Registers/Accumulation/factory';
import { createRegisterInfo } from '../models/Registers/Info/factory';

export const router = express.Router();

router.get('/register/account/movements/view/:id', async (req, res, next) => {
  try {
    const query = `SELECT * FROM "Register.Account.View" where document_id = $1`;
    const data = await db.manyOrNone(query, [req.params.id]);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/register/accumulation/list/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.manyOrNone(`
        SELECT DISTINCT r.data->>'type' "type", s.description FROM "Register.Accumulation" r
        LEFT JOIN config_schema s ON s.type = r.data->>'type'
        WHERE r.data @> $1`, [{document: req.params.id}]);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/register/info/list/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.manyOrNone(`
        SELECT DISTINCT r.data->>'type' "type", s.description FROM "Register.Info" r
        LEFT JOIN config_schema s ON s.type = r.data->>'type'
        WHERE r.data @> $1`, [{document: req.params.id}]);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/register/accumulation/:type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result; let config_schema;
    const JRegister = createRegisterAccumulation(req.params.type, true, {});
    config_schema = { queryObject: JRegister.QueryList() };
    result = await db.manyOrNone(`${config_schema.queryObject} AND r.data @> $1`, [{document: req.params.id}]);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/register/info/:type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result; let config_schema;
    const JRegister = createRegisterInfo(req.params.type, {});
    config_schema = { queryObject: JRegister.QueryList() };
    result = await db.manyOrNone(`${config_schema.queryObject} AND r.data @> $1`, [{document: req.params.id}]);
    res.json(result);
  } catch (err) { next(err); }
});



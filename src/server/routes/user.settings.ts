import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { db, ADB } from './../db';
import { FormListSettings, UserDefaultsSettings } from './../models/user.settings';
import { IAccount } from '../models/api';

export const router = express.Router();

export function User(req: Request): string {
  return (<any>req).user.email;
}

router.get('/user/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = User(req);
    const query = `select data result from "accounts" where id = '${email}'`;
    const result = await ADB.oneOrNone(query);
    res.json(result ? (result.result as IAccount).roles : []);
  } catch (err) { next(err); }
});

router.get('/user/settings/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = User(req);
    const query = `select settings->'defaults' result from users where email = '${user}'`;
    const result = await db.oneOrNone<{ result: UserDefaultsSettings }>(query);
    res.json(result ? result.result : new UserDefaultsSettings());
  } catch (err) { next(err); }
});

router.post('/user/settings/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = User(req);
    const data = req.body || new UserDefaultsSettings();
    const query = `update users set settings = jsonb_set(settings, '{"defaults"}, $1) where email = '${user}'`;
    const result = await db.none(query, [data]);
    res.json(true);
  } catch (err) { next(err); }
});


router.get('/user/settings/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = User(req);
    const query = `select settings->'${req.params.type}' result from users where email = '${user}'`;
    const result = (await db.oneOrNone<{ result: FormListSettings }>(query));
    res.json(result ? result.result : new FormListSettings());
  } catch (err) { next(err); }
});

router.post('/user/settings/:type', async (req, res, next) => {
  try {
    const user = User(req);
    const data = req.body || {};
    const query = `update users set settings = jsonb_set(settings, '{"${req.params.type}"}', $1) where email = '${user}'`;
    const settings = await db.none(query, [data]);
    res.json(true);
  } catch (err) { next(err); }
});

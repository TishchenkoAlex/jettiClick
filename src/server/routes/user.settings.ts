import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { FormListSettings, UserDefaultsSettings } from './../models/user.settings';
import { IAccount } from '../models/api';
import { sdb, sdba } from '../mssql';

export const router = express.Router();

export function User(req: Request): string {
  return (<any>req).user.email;
}

router.get('/user/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = User(req);
    const query = `select JSON_QUERY(data, '$') result from "accounts" where id = '${email}'`;
    const result = await sdba.oneOrNone<any>(query);
    res.json(result ? (result.result as IAccount).roles : []);
  } catch (err) { next(err); }
});

router.get('/user/settings/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = User(req);
    const query = `select JSON_QUERY(settings, '$."${req.params.type}"') result from users where email = '${user}'`;
    const result = await sdb.oneOrNone<{ result: FormListSettings }>(query);
    res.json(result ? result.result : new FormListSettings());
  } catch (err) { next(err); }
});

router.post('/user/settings/:type', async (req, res, next) => {
  try {
    const user = User(req);
    const data = req.body || {};
    const query = `update users set settings = JSON_MODIFY(settings, '$."${req.params.type}"', JSON_QUERY(@p1)) where email = '${user}'`;
    await sdb.none(query, [JSON.stringify(data)]);
    res.json(true);
  } catch (err) { next(err); }
});

router.get('/user/settings/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = User(req);
    const query = `select JSON_QUERY(settings, '$."defaults"') result from users where email = '${user}'`;
    const result = await sdb.oneOrNone<{ result: UserDefaultsSettings }>(query);
    res.json(result ? result.result : new UserDefaultsSettings());
  } catch (err) { next(err); }
});

router.post('/user/settings/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = User(req);
    const data = req.body || new UserDefaultsSettings();
    const query = `update users set settings = JSON_MODIFY(settings, '$."defaults"', JSON_QUERY(@p1)) where email = '${user}'`;
    const result = await sdb.none(query, [JSON.stringify(data)]);
    res.json(true);
  } catch (err) { next(err); }
});

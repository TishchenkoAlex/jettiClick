import * as express from 'express';
import { NextFunction, Request, Response } from 'express';

import { db } from './../db';
import { FormListSettings, UserDefaultsSettings } from './../models/user.settings';

export const router = express.Router();

router.get('/user/settings/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
    const query = `select settings->'defaults' result from users where email = '${user}'`;
    const result = await db.oneOrNone<{ result: UserDefaultsSettings }>(query);
    res.json(result ? result.result : new UserDefaultsSettings());
  } catch (err) { next(err.message); }
})

router.post('/user/settings/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
    const data = req.body || new UserDefaultsSettings();
    const query = `update users set settings = jsonb_set(settings, '{"defaults"}, $1) where email = '${user}'`;
    const result = await db.none(query, [data]);
    res.json(true);
  } catch (err) { next(err.message); }
});


router.get('/user/settings/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user && req.user.sub && req.user.sub.split('|')[1] || '';
    const query = `select settings->'${req.params.type}' result from users where email = '${user}'`;
    const result = (await db.oneOrNone<{ result: FormListSettings }>(query));
    res.json(result ? result.result : new FormListSettings());
  } catch (err) { next(err.message); }
});


router.post('/user/settings/:type', async (req, res, next) => {
  try {
    const user = (req.user && req.user.sub && req.user.sub.split('|')[1]) || '';
    const data = req.body || {};
    const query = `update users set settings = jsonb_set(settings, '{"${req.params.type}"}', $1) where email = '${user}'`;
    const settings = await db.none(query, [data]);
    res.json(true);
  } catch (err) { next(err.message); }
});

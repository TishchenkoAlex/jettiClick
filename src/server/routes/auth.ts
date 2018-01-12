import * as bcrypt from 'bcrypt';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';

import { JTW_KEY } from '../env/environment';
import { IAccount } from '../models/api';
import { Accounts } from './middleware/accounts.db';
import checkAuth from './middleware/check-auth';

// tslint:disable-next-line:max-line-length
const email: RegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

export const router = express.Router();

export interface IJWTPayload {
  email: string;
  description: string;
  isAdmin: boolean;
  roles: string[];
  env: { [x: string]: string };
}

router.get('/account', checkAuth, async (req, res, next) => {
  try {
    res.json(await Accounts.get((<any>req).user.email));
  } catch (err) { next(err); }
});

router.get('/:key', checkAuth, async (req, res, next) => {
  try {
    const payload: IJWTPayload = (<any>req).user;
    if (!payload.isAdmin) { return res.status(401).json({ message: 'only Admin action' }); }
    const data = await Accounts.get(req.params.key);
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/singup', checkAuth, async (req, res, next) => {
  try {
    const payload: IJWTPayload = (<any>req).user;
    if (!payload.isAdmin) { return res.status(401).json({ message: 'only Admin action' }); }
    const source = req.body as IAccount;
    const existing = await Accounts.get(source.email);
    if (existing) {
      return res.status(309).json({ message: 'email exists' });
    }
    const account: IAccount = await post(source);
    res.status(201).send(account);
  } catch (err) { next(err); }
});

router.post('/', checkAuth, async (req, res, next) => {
  try {
    const payload: IJWTPayload = (<any>req).user;
    if (!payload.isAdmin) { return res.status(401).json({ message: 'only Admin action' }); }
    const source = req.body as IAccount;
    const existing = await Accounts.get(source.email);
    if (!existing) {
      return res.status(404).json({ message: 'email not exists' });
    }
    const combined = { ...existing, ...source };
    const account: IAccount = await post(combined);
    res.status(201).send(account);
  } catch (err) { next(err); }
});

async function post(source: IAccount) {
  if (!email.test(source.email)) {
    throw new Error('email incorrect');
  }
  const account: IAccount = {
    email: source.email,
    password: await bcrypt.hash(source.password, 10),
    created: source.created || new Date().toJSON(),
    description: source.description || '',
    status: source.status,
    isAdmin: source.isAdmin || false,
    roles: source.roles || [],
    env: source.env || {}
  };
  await Accounts.set(account);
  return account;
}

router.delete('/:key', checkAuth, async (req, res, next) => {
  try {
    const payload: IJWTPayload = (<any>req).user;
    if (!payload.isAdmin) { return res.status(401).json({ message: 'only Admin action' }); }
    const existing = await Accounts.get(req.params.key);
    if (!existing) {
      return res.status(404).json({ message: 'email not exists' });
    }
    Accounts.del(req.params.key);
    res.send(true);
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    // tslint:disable-next-line:no-shadowed-variable
    const { email, password } = req.body;
    if (!email) {
      return res.status(401).json({ message: 'Auth failed' });
    }
    const existing = await Accounts.get(email);
    if (!existing) {
      return res.status(401).json({ message: 'Auth failed' });
    }
    const equal = await bcrypt.compare(password, existing.password);
    if (!equal) {
      return res.status(401).json({ message: 'Auth failed' });
    }
    const payload: IJWTPayload = {
      email: existing.email,
      description: existing.description,
      isAdmin: existing.isAdmin === true ? true : false,
      roles: existing.roles,
      env: existing.env,
    };
    const token = jwt.sign(payload, JTW_KEY, { expiresIn: 10000 });
    return res.json({ account: existing, token });
  } catch (err) { next(err); }
});


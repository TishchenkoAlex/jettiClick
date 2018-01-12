import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import { JTW_KEY } from '../../env/environment';
import { IJWTPayload } from '../auth';

export default async function (req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.headers.authorization as string).split(' ')[1];
    const decoded = await jwt.verify(token, JTW_KEY as string) as IJWTPayload;
    (<any>req).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Auth failed:' + error });
  }
}

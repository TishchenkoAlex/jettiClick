import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as SocketIO from 'socket.io';

import { JTW_KEY } from '../../env/environment';
import { IJWTPayload } from '../auth';

export async function authHTTP (req: Request, res: Response, next: NextFunction) {
  try {
    const token = ((req.headers.authorization as string) || '').split(' ')[1];
    const decoded = await jwt.verify(token, JTW_KEY as string) as IJWTPayload;
    (<any>req).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Auth failed:' + error });
  }
}

export async function authIO(socket: SocketIO.Socket, next) {
  const handshakeData = socket.request;
  const token = socket.handshake.query.token;
  try {
    const decoded = await jwt.verify(token, JTW_KEY as string) as IJWTPayload;
    socket.handshake.query.user = decoded.email;
    next();
  } catch (error) {
    next(new Error(error));
  }
}

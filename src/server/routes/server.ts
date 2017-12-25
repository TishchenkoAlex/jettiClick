import { NextFunction, Request, Response } from 'express';
import * as express from 'express';

import { PatchValue } from '../models/api';
import { DocTypes } from '../models/documents.types';
import { FormBase } from '../models/Forms/form';
import { FormTypes } from '../models/Forms/form.types';
import FormPostServer from './../models/Forms/Form.Post.server';
import { ICallRequest } from './../routes/utils/interfaces';

export const router = express.Router();
export const server = new Map<FormTypes | DocTypes, any>([
  ['Form.Post', FormPostServer]
]);

// Select documents list for UI (grids/list etc)
router.post('/call/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const CR: ICallRequest = req.body;
    CR.user = req.user && req.user.sub;
    const ClassType = server.get(CR.type);
    if (!ClassType) { throw new Error(`Server module for '${CR.type}' is not registered.`) }
    const Class = new ClassType(CR);
    const ClassMethod = Class[CR.method];
    if (!ClassMethod) { throw new Error(`Server Method '${CR.method}' for '${CR.type}'  not found.`) }
    if (req.params[0] === 'async') {
      Class[CR.method]().then(() => {})
    } else {
      await Class[CR.method]();
    }
    res.json(true);
  } catch (err) { next(err) }
});


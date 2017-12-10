import { IDatabase, ITask } from 'pg-promise';
import { v1 } from 'uuid';
import { Ref } from '../models/document';
import { IServerDocument } from './../models/ServerDocument';
import { TX } from '../db';

export interface RefValue {
  id: Ref,
  type: string,
  code: string,
  value: string | number | boolean
}

export const JETTI_DOC_PROP =
  ['user', 'company', 'parent', 'info', 'isfolder', 'description', 'id', 'type', 'date', 'code', 'posted', 'deleted'];

export interface PatchValue { [x: string]: (boolean | number | string | RefValue | {}) }

export interface FileldsAction {
  [field: string]: (doc: IServerDocument, value: RefValue) => Promise<PatchValue>
}

export interface ValueChanges {
  [type: string]: FileldsAction
}

export type Post = (doc: IServerDocument, Registers: { Account: any[], Accumulation: any[], Info: any[] }, tx: TX) => any

export interface IJDM {
  [x: string]: {
    post?: Post,
    valueChanges?: FileldsAction
  }
}

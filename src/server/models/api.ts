import { FormListFilter, FormListOrder } from './user.settings';
import { DocumentBase, Ref } from './../models/document';
import * as Queue from 'bull';
import { AllTypes } from '../models/documents.types';
import { RoleType } from './Roles/Base';

export interface DocListRequestBody {
  id: string; type: string; command: string; count: number; offset: number;
  filter: FormListFilter[];
  order: FormListOrder[];
}

export interface Continuation { first: { id: Ref, type: string }; last: { id: Ref, type: string }; }
export interface DocListResponse { data: any[]; continuation: Continuation; }

export interface MenuItem { type: string; description: string; icon: string; menu: string; }

export interface RefValue {
  id: Ref;
  type: string;
  code: string;
  value: string | number | boolean;
}

export interface PatchValue { [x: string]: (boolean | number | string | RefValue | {}); }

export interface IJettiTask {
  id: number;
  description: string;
  user: string;
  progress: number;
  status: boolean;
  error: string;
  url: string;
  name: string;
}

export interface IEvent {
  id: string;
  startedAt: Date;
  endedAt: Date;
  description: string;
  user: string;
  error: string;
  progress: number;
  url: string;
}

export interface IJob {
  id: string;
  progress: number;
  opts: { [x: string]: any };
  delay: number;
  timestamp: number;
  returnvalue: any;
  attemptsMade: number;
  failedReason: string;
  finishedOn: number;
  processedOn: number;
  data: { [x: string]: any };
}

export interface IJobs {
  Active: IJob[];
  Completed: IJob[];
  Delayed: IJob[];
  Failed: IJob[];
  RepeatableJobs: Queue.JobInformation[];
}

export interface IAccount {
  email: string;
  description: string;
  created: string;
  password: string;
  status: string;
  isAdmin: boolean;
  roles: RoleType[];
  env: { [x: string]: string };
}

export interface ILoginResponse {
  account: IAccount;
  token: string;
}

export interface ITree {
  id: string;
  description: string;
  parent: string;
}

export interface ISuggest {
  id: string;
  type: AllTypes;
  code: string;
  description: string;
}

export function calculateDescription(description: string, date: Date, code: string, group = '') {
  const Group = group ? '(' + group + ')' : '';
  const value = `${description} ${Group} #${code}, ${date.toISOString()}`;
  return value;
}

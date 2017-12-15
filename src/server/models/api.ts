import { FormListFilter, FormListOrder } from './user.settings';
import { DocumentBase, Ref } from './../models/document';

export interface DocListRequestBody {
  id: string, type: string, command: string, count: number, offset: number,
  filter: FormListFilter[];
  order: FormListOrder[];
}

export interface Continuation { first: {id: Ref, type: string}, last: {id: Ref, type: string} }
export interface DocListResponse { data: any[], continuation: Continuation };

export interface MenuItem { type: string; description: string; icon: string; menu: string }

export interface RefValue {
  id: Ref,
  type: string,
  code: string,
  value: string | number | boolean
}

export interface PatchValue { [x: string]: (boolean | number | string | RefValue | {}) }

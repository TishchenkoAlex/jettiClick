import { DocModel } from '../modules/doc.base';
import { FormListFilter, FormListOrder } from './user.settings';

export interface DocListRequestBody {
  id: string, type: string, command: string, count: number, offset: number,
  filter: FormListFilter[];
  order: FormListOrder[];
}

export interface Continuation { first: DocModel, last: DocModel }
export interface DocListResponse2 { data: any[], continuation: Continuation };

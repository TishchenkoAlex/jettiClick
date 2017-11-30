import { DocModel } from '../modules/doc.base';
import { FormListFilter, FormListOrder } from './user.settings';

export interface DocListRequestBody {
  id: string, type: string, command: string, count: number, offset: number,
  filter: FormListFilter[];
  order: FormListOrder[];
}

export interface Continuation { first: DocModel, last: DocModel }
export interface DocListResponse { data: any[], continuation: Continuation };

export interface MenuItem { type: string; description: string; icon: string; menu: string }

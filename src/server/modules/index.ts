import { ValueChanges, IDocBase, FileldsAction } from './doc.base';
import { CashIn } from './Document.CashIn';
import { Operation } from './Document.Operation';
import { Invoice } from './Document.Invoice';
import { ITask, IDatabase } from 'pg-promise';

export interface IJDM {
  [x: string]: {
    post: (doc: IDocBase, Registers: { Account: any[], Accumulation: any[], Info: any[] }, tx?: ITask<any> | IDatabase<any>) => any,
    valueChanges: FileldsAction
  }
}

export const valueChanges: ValueChanges = {
  'Document.CashIn': CashIn.Actions,
  'Document.Operation': Operation.Actions,
  'Document.Invoice': Invoice.Actions
}

export const JDM: IJDM = {
  'Document.Invoice': {
    post: Invoice.post,
    valueChanges: Invoice.Actions
  },
  'Document.CashIn': {
    post: CashIn.post,
    valueChanges: CashIn.Actions
  },
  'Document.Operation': {
    post: null,
    valueChanges: Operation.Actions
  }
}

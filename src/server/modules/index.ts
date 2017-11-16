import { IJDM } from './doc.base';
import { CashIn } from './Document.CashIn';
import { ExchangeRates } from './Document.ExchangeRates';
import { Invoice } from './Document.Invoice';
import { Operation } from './Document.Operation';
import { PriceList } from './Document.PriceList';

export const JDM: IJDM = {
  'Document.Invoice': {
    post: Invoice.post,
    valueChanges: Invoice.Actions
  },
  'Document.CashIn': {
    valueChanges: CashIn.Actions
  },
  'Document.Operation': {
    valueChanges: Operation.Actions,
    post: Operation.post
  },
  'Document.PriceList': {
    post: PriceList.post,
  },
  'Document.ExchangeRates': {
    post: ExchangeRates.post,
  }
}

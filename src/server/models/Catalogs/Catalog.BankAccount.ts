import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.BankAccount',
  description: 'Банковский счет',
  icon: 'fa fa-money',
  menu: 'Банковкие счета',
  prefix: 'BANK-'
})
export class CatalogBankAccount extends DocumentBase {

  @Props({ type: 'Catalog.BankAccount', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Currency', required: true, style: { width: '100px' } })
  currency: Ref = null;

}

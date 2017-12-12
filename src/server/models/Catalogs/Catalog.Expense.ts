import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Expense',
  description: 'Статья расходов',
  icon: 'fa fa-money',
  menu: 'Статьи расходов',
  prefix: 'EXP-'
})
export class CatalogExpense extends DocumentBase {

  @Props({ type: 'Catalog.Expense', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Account' })
  Account: Ref = null;

}

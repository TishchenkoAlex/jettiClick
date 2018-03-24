import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Expense.Analytics',
  description: 'Аналитика расходов',
  icon: 'fa fa-money',
  menu: 'Аналитики расходов',
  prefix: 'EXP.A-'
})
export class CatalogExpenseAnalytics extends DocumentBase {

  @Props({ type: 'Catalog.Expense', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

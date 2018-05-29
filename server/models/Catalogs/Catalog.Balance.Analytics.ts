import { DocumentBase, JDocument, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Balance.Analytics',
  description: 'Аналитика баланса',
  icon: 'fa fa-money',
  menu: 'Аналитики баланса',
  prefix: 'BAL.A-'
})
export class CatalogBalanceAnalytics extends DocumentBase {

  @Props({ type: 'Catalog.Balance', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

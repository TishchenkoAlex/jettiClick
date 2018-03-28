import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.CashFlow',
  description: 'Статья ДДС',
  icon: 'fa fa-money',
  menu: 'Статьи ДДС',
  prefix: ''
})
export class CatalogCashFlow extends DocumentBase {

  @Props({ type: 'Catalog.CashFlow', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

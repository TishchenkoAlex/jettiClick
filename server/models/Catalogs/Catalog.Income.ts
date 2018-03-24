import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Income',
  description: 'Статья доходов',
  icon: 'fa fa-money',
  menu: 'Статьи доходов',
  prefix: null
})
export class CatalogIncome extends DocumentBase {

  @Props({ type: 'Catalog.Income', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Account' })
  Account: Ref = null;

}

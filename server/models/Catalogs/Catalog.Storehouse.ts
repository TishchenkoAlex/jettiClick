import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Storehouse',
  description: 'Склад',
  icon: 'fa fa-money',
  menu: 'Склады',
  prefix: 'STOR-'
})
export class CatalogStorehouse extends DocumentBase {

  @Props({ type: 'Catalog.Storehouse', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

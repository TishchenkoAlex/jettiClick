import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Brand',
  description: 'Бенды',
  icon: 'fa fa-money',
  menu: 'Бенды',
  prefix: 'BRAND-'
})
export class CatalogBrand extends DocumentBase {

  @Props({ type: 'Catalog.Brand', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

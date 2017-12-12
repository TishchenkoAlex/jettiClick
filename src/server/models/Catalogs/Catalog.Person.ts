import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Person',
  description: 'Физлицо',
  icon: 'fa fa-money',
  menu: 'Физлица',
  prefix: 'PERS-'
})
export class CatalogPerson extends DocumentBase {

  @Props({ type: 'Catalog.Person', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

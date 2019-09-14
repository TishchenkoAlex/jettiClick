import { DocumentBase, JDocument, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Person',
  description: 'Физлицо',
  icon: 'fa fa-list',
  menu: 'Физлица',
  prefix: 'PERS-'
})
export class CatalogPerson extends DocumentBase {

  @Props({ type: 'Catalog.Person', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'string', label: 'Exchange code', hiddenInList: true, readOnly: true})
  ExchangeCode = '';

  @Props({ type: 'string', label: 'Exchange base', hiddenInList: true, readOnly: true})
  ExchangeBase = '';

}

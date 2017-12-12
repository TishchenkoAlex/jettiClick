import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Manager',
  description: 'Менеджер',
  icon: 'fa fa-money',
  menu: 'Менеджеры',
  prefix: 'MAN-'
})
export class CatalogManager extends DocumentBase {

  @Props({ type: 'Catalog.Manager', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'string', required: true })
  FullName: boolean = null;

  @Props({ type: 'boolean', required: true })
  Gender: boolean = null;

  @Props({ type: 'date' })
  Birthday: boolean = null;

  @Props({ type: 'Types.Subcount', required: true })
  Product: boolean = null;

}

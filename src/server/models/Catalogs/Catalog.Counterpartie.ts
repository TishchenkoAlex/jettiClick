import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Counterpartie',
  description: 'Контрагент',
  icon: 'fa fa-money',
  menu: 'Контрагенты',
  prefix: 'CPE-'
})
export class CatalogCounterpartie extends DocumentBase {

  @Props({ type: 'Catalog.Counterpartie', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'boolean', required: true })
  Client: boolean = null;

  @Props({ type: 'boolean', required: true })
  Supplier: boolean = null;

  @Props({ type: 'string', required: true, style: {width: '50%'} })
  FillName: string = null;

}

import { DocumentBase, JDocument, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Counterpartie',
  description: 'Контрагент',
  icon: 'fa fa-list',
  menu: 'Контрагенты',
  prefix: 'CPE-',
  copyTo: [
    'Document.Invoice'
  ],
  relations: [
    { name: 'Client invoices', type: 'Document.Invoice', field: 'Customer' }
  ],
  hierarchy: 'folders'
})
export class CatalogCounterpartie extends DocumentBase {

  @Props({ type: 'Catalog.Counterpartie', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'string', required: true })
  FullName = '';

  @Props({ type: 'boolean', required: true })
  Client = false;

  @Props({ type: 'boolean', required: true })
  Supplier = false;

  @Props({ type: 'Catalog.Department', required: false })
  Department: Ref = null;

}

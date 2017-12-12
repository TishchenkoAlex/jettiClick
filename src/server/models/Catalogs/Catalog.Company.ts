import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Company',
  description: 'Организация',
  icon: 'fa fa-money',
  menu: 'Организации',
  prefix: 'ORG-'
})
export class CatalogCompany extends DocumentBase {

  @Props({ type: 'Catalog.Company', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Currency', required: true, label: 'default currency', style: { width: '100px' } })
  currency: Ref = null;

  @Props({ type: 'string', required: true })
  prefix: string = null;

}

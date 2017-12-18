import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Currency',
  description: 'Валюта',
  icon: 'fa fa-money',
  menu: 'Валюты',
  prefix: null
})
export class CatalogCurrency extends DocumentBase {

  @Props({ type: 'Catalog.Currency', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'string', order: 1, required: true, style: { width: '140px' } })
  code = '';

}

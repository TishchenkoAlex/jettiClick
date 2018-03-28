import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.PriceType',
  description: 'Типы цен',
  icon: 'fa fa-money',
  menu: 'Типы цен',
  prefix: 'PRT-'
})
export class CatalogPriceType extends DocumentBase {

  @Props({ type: 'Catalog.PriceType', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Currency', required: true, style: { width: '100px' } })
  currency: Ref = null;

  @Props({ type: 'boolean', required: true })
  TaxInclude = false;

}

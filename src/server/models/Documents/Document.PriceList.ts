import { DocumentBase, JDocument, Props, Ref } from './../document';

@JDocument({
  type: 'Document.PriceList',
  description: 'Price list',
  icon: 'fa fa-file-text-o',
  menu: 'Price list',
  prefix: 'PRICE-'
})
export class DocumentPriceList extends DocumentBase {
  @Props({ type: 'Types.Document', hiddenInList: true, order: -1 })
  parent = null;

  @Props({ type: 'Catalog.PriceType', required: true, label: 'price type' })
  PriceType = null;

  @Props({ type: 'boolean', required: true, label: 'tax include' })
  TaxInclude: boolean = null;

  @Props({ type: 'table', required: true, order: 1 })
  Items: TableItems[] = [new TableItems()];
}

class TableItems {
  @Props({ type: 'Catalog.Product', required: true, style: {width: '50%'} })
  SKU = null;

  @Props({ type: 'Catalog.Unit', required: true, style: {width: '30%'} })
  Unit = null;

  @Props({ type: 'number',  required: true, style: {width: '20%'} })
  Price: number = null;
}

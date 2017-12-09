import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Currency',
  description: 'Валюта',
  icon: 'attach_money',
  chapter: 'Document',
  menu: 'Валюты',
  prifix: 'CUR'
})
export class CatalogCurrency extends DocumentBase {

  @Props({ type: 'Catalog.Currency', hiddenInList: true })
  parent: Ref = null;

}

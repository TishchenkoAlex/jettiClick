import { JDocumentBase , Props, Ref, JDocument} from './document';
import {  } from './documents.types';

@JDocument({
  type: 'Catalog.Currency',
  description: 'Валюта',
  icon: 'attach_money',
  chapter: 'Document',
  menu: 'Валюты',
  prifix: 'CUR'
})
export class CatalogCurrency extends JDocumentBase {
  @Props({ type: 'datetime', hidden: true })
  date: Date;

  @Props({ type: 'Catalog.Currency', 'hiddenInList': true })
  parent: Ref = null;
}

import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Account',
  description: 'Счет БУ',
  icon: 'fa fa-list',
  menu: 'Счета БУ',
  prefix: null,
  presentation: 'code',
})
export class CatalogAccount extends DocumentBase {

  @Props({ type: 'Catalog.Account', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'boolean', required: true })
  isForex = false;

  @Props({ type: 'boolean' })
  isActive: boolean = null;

  @Props({ type: 'boolean' })
  isPassive: boolean = null;

  @Props({ type: 'table' })
  Subcounts: Subcounts[] = [new Subcounts()];
}

class Subcounts {
  @Props({ type: 'Catalog.Subcount', required: true, order: -1 })
  Subcount: Ref = null;

  @Props({ type: 'boolean' })
  isQty: boolean = null;

  @Props({ type: 'boolean' })
  isSum: boolean = null;

  @Props({ type: 'boolean', label: 'isTO' })
  isTurnoversOnly: boolean = null;
}

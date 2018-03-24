import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Balance',
  description: 'Статья баланса',
  icon: 'fa fa-money',
  menu: 'Статьи баланса',
  prefix: null,
  relations: [
    { name: 'Balance analytics', type: 'Catalog.Balance.Analytics', field: 'parent' }
  ]
})
export class CatalogBalance extends DocumentBase {

  @Props({ type: 'Catalog.Balance', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'boolean'})
  isActive: boolean = null;

  @Props({ type: 'boolean'})
  isPassive: boolean = null;

  @Props({ type: 'table'})
  Subcounts: Subcounts[] = [new Subcounts()];
}

class Subcounts {
  @Props({ type: 'Catalog.Subcount', required: true})
  Subcount: Ref = null;
}

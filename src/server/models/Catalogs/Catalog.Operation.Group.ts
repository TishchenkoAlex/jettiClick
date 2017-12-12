import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Operation.Group',
  description: 'Группа операции',
  icon: 'fa fa-money',
  menu: 'Группы операций',
  prefix: 'OPG-'
})
export class CatalogOperationGroup extends DocumentBase {

  @Props({ type: 'Catalog.Operation.Group', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'string', required: true})
  Prefix: string = null;

}

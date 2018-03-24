import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Department',
  description: 'Подразделение',
  icon: 'fa fa-money',
  menu: 'Подразделения',
  prefix: 'DEP-'
})
export class CatalogDepartment extends DocumentBase {

  @Props({ type: 'Catalog.Department', hiddenInList: true, order: -1 })
  parent: Ref = null;

}

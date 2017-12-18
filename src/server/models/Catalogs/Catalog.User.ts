import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.User',
  description: 'Пользователь',
  icon: 'fa fa-money',
  menu: 'Пользователи',
  prefix: 'USR-'
})
export class CatalogUser extends DocumentBase {

  @Props({ type: 'Catalog.User', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'string', order: 1, required: true, style: { width: '250px' } })
  code = '';

}

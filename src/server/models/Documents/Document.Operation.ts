import { CatalogOperation } from '../../models/Catalogs/Catalog.Operation';
import { DocumentBase, JDocument, Props, Ref, DocumentOptions } from './../document';
import { SQLGenegator } from '../../fuctions/SQLGenerator';

@JDocument({
  type: 'Document.Operation',
  description: 'Operation',
  dimensions: [
    { column1: 'string' },
    { column2: 'string' }
  ],
  icon: 'fa fa-file-text-o',
  menu: 'Operations',
  prefix: 'OPER-',
  commands: [],
})
export class DocumentOperation extends DocumentBase {
  @Props({ type: 'Types.Document', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Operation.Group', order: 4, label: 'Group', style: { display: 'none' } })
  Group: Ref = null;

  @Props({ type: 'Catalog.Operation', owner: 'Group', required: true, onChangeServer: true, order: 5, style: { width: '270px' } })
  Operation: Ref = null;

  @Props({ type: 'number', order: 6 })
  Amount: number = null;

  @Props({ type: 'Catalog.Currency', required: true, order: 7, label: 'Cur', style: { width: '70px' } })
  currency: Ref = null;

}

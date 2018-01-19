import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Operation',
  description: 'Правило операции',
  icon: 'fa fa-money',
  menu: 'Правила операций',
  dimensions: [
    { Group: 'Catalog.Operation.Group' }
  ],
  prefix: 'RULE-'
})
export class CatalogOperation extends DocumentBase {

  @Props({ type: 'Catalog.Operation', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Operation.Group', order: 2, label: 'Operation group', required: true, style: { width: '30%' } })
  Group: Ref = null;

  @Props({ type: 'string', order: 3, required: true, style: { width: '50%' }})
  description = null;

  @Props({ type: 'javascript', required: true, hiddenInList: true, style: { height: '400px' } })
  script: string = null;

  @Props({ type: 'table' })
  Parameters: Parameter[] = [new Parameter()];

}

class Parameter {
  @Props({ type: 'string', required: true, order: 1 })
  parameter: string = null;

  @Props({ type: 'string', required: true, order: 2 })
  label: string = null;

  @Props({ type: 'Catalog.Subcount', required: true, order: 3 })
  type: Ref = null;

  @Props({ type: 'number', required: true, order: 4 })
  order: number = null;

  @Props({ type: 'boolean', required: true, order: 5 })
  required: Ref = null;

  @Props({ type: 'javascript', label: 'change script', hiddenInList: true, order: 101 })
  change: string = null;

  @Props({ type: 'json', hiddenInList: true, order: 100 })
  tableDef: string = null;

}
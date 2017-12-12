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

  @Props({ type: 'Catalog.Operation.Group', label: 'Operation group', required: true })
  Group: Ref = null;

  @Props({ type: 'javascript', required: true, hiddenInList: true, style: { height: '400px' } })
  script: string = null;

  @Props({ type: 'table' })
  Parameters: Parameter[] = [new Parameter()]

}

class Parameter {
  @Props({ type: 'string', required: true })
  parameter: string = null;

  @Props({ type: 'string', required: true })
  label: string = null;

  @Props({ type: 'Catalog.Subcount', required: true })
  type: Ref = null;

  @Props({ type: 'number', required: true })
  order: number = null;

  @Props({ type: 'javascript', label: 'change script', hiddenInList: true })
  change: string = null;

  @Props({ type: 'boolean', required: true })
  required: Ref = null;

  @Props({ type: 'json', hiddenInList: true })
  tableDef: string = null;

}

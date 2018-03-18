import { JDocument, DocumentBase, Props, Ref } from './../document';

const defaultScript = `
// const CashFlow = lib.doc.byCode('Catalog.CashFlow', 'IN.CUSTOMER');

// Account
//Registers.Account.push({
//    debit: { account: lib.account.byCode('50.01'), subcounts: [$.CashRegister, CashFlow] },
//    kredit: { account: lib.account.byCode('62.01'), subcounts: [$.Customer] },
//    sum: $.Amount
// });
`;

@JDocument({
  type: 'Catalog.Operation',
  description: 'Правило операции',
  icon: 'fa fa-money',
  menu: 'Правила операций',
  dimensions: [
    { Group: 'Catalog.Operation.Group' }
  ],
  prefix: 'RULE-',
  relations: [
    { name: 'Operations', type: 'Document.Operation', field: 'Operation' }
  ]
})
export class CatalogOperation extends DocumentBase {

  @Props({ type: 'Catalog.Operation', hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'Catalog.Operation.Group', order: 2, label: 'Operation group', required: true, style: { width: '30%' } })
  Group: Ref = null;

  @Props({ type: 'string', order: 3, required: true, style: { width: '50%' }})
  description = null;

  @Props({ type: 'javascript', required: true, hiddenInList: true, style: { height: '800px', overflow: 'auto' }, value: defaultScript })
  script: string = null;

  @Props({ type: 'table' })
  Parameters: Parameter[] = [new Parameter()];

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

  @Props({ type: 'boolean', required: true })
  required: Ref = null;

  @Props({ type: 'javascript', label: 'change script', hiddenInList: true })
  change: string = null;

  @Props({ type: 'json', hiddenInList: true })
  tableDef: string = null;

  @Props({ type: 'json', hiddenInList: true })
  Props: string = null;

}

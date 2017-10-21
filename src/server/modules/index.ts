import { ValueChanges } from './doc.base';
import { CashInActions } from './Document.CashIn';
import { OperationActions } from './Document.Operation';


export const valueChanges: ValueChanges = {
    'Document.CashIn': CashInActions,
    'Document.Operation': OperationActions
}

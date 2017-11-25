import { BaseListComponent } from '../common/datatable/base.list.component';
import { BaseFormComponent } from '../common/form/base.form.components/base.form.component';
import { CashRegisterFormComponent } from './Catalog/CashRegister/CashRegister.form';
import { CashRegisterListComponent } from './Catalog/CashRegister/CashRegister.list';
import { OperationFormComponent } from './Operation/operation.form.component';
import { OperationListComponent } from './Operation/operation.list.component';

const userForms = [
    { type: 'Document.ClientOrder', objectComponent: CashRegisterFormComponent, listComponent: CashRegisterListComponent },
    { type: 'Document.Operation', objectComponent: OperationFormComponent, listComponent: OperationListComponent },
    { type: 'Document.Operation.CASH.IN', objectComponent: OperationFormComponent, listComponent: BaseListComponent }
    // add user extensions here
]

export function getDocListComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return BaseListComponent; }
    return userForms[index].listComponent;
}

export function getDocObjectComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return BaseFormComponent; }
    return userForms[index].objectComponent;
}

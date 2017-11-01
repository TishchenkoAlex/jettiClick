import { CommonDataTableComponent } from '../common/datatable/datatable.component';
import { BaseFormComponent } from '../common/form/form.base.components/form.base.component';
import { CashRegisterFormComponent } from './Catalog/CashRegister/CashRegister.form';
import { OperationFormComponent } from './Operation/operation.form.component';

const userForms = [
    { type: 'Document.Operation', objectComponent: OperationFormComponent, listComponent: CommonDataTableComponent }
]

export function getDocListComponent(type: string): typeof CommonDataTableComponent {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return CommonDataTableComponent; }
    return userForms[index].listComponent;
}

export function getDocObjectComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return BaseFormComponent; }
    return userForms[index].objectComponent;
}

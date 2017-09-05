import { CommonDataTableComponent } from '../common/datatable/datatable.component';
import { CashRegisterForm } from './Catalog/CashRegister/CashRegister.form';
import { BaseFormComponent } from '../common/form/form.base.components/form.base.component';

const userForms = [
    { type: 'Catalog.Products', objectComponent: CashRegisterForm, listComponent: CommonDataTableComponent }
]

export function getDocListComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return CommonDataTableComponent; }
    return userForms[index].listComponent;
}

export function getDocObjectComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return BaseFormComponent; }
    return userForms[index].objectComponent;
}

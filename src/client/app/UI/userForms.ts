import { CommonFromComponent } from '../common/form/form.component';
import { CommonDataTableComponent } from '../common/datatable/datatable.component';
import { CashRegisterForm } from './Catalog/CashRegister/CashRegister.form';

const userForms = [
    {type: 'Catalog.Products', objectComponent: CashRegisterForm, listComponent: CommonDataTableComponent}
]

export function getDocListComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return  CommonDataTableComponent; }
    return userForms[index].listComponent;
}

export function getDocObjectComponent(type: string) {
    const index = userForms.findIndex((data) => data.type === type);
    if (index === -1) { return  CommonFromComponent; }
    return userForms[index].objectComponent;
}

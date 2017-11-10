import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CovalentCodeEditorModule } from '@covalent/code-editor';

import { TablePartsComponent } from '../common/datatable/table-parts.component';
import { DynamicFilterControlComponent } from '../common/filter-column/dynamic-filter-control.component';
import { FilterFormComponent } from '../common/filter/filter.component';
import { RegisterAccumulationComponent } from '../common/register-movements/register.accumulation.component';
import { RegisterAccumulationListComponent } from '../common/register-movements/register.accumulation.list.component';
import { AutocompleteComponent } from './../common/autocomplete/autocomplete.component';
import { BaseListComponent } from './../common/datatable/base.list.component';
import { DocService } from './../common/doc.service';
import { DynamicComponent, DynamicComponentDirective } from './../common/dynamic-component/dynamic-component';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';
import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { FilterColumnComponent } from './../common/filter-column/fiter-column.component';
import { BaseFormComponent } from './../common/form/base.form.components/base.form.component';
import { RegisterMovementComponent } from './../common/register-movements/register-movement.component';
import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { TabControllerService } from './../common/tabcontroller/tabcontroller.service';
import { SuggestDialogComponent } from './../dialog/suggest.dialog.component';
import { TablePartsDialogComponent } from './../dialog/table-parts.dialog.component';
import { HomeComponent } from './../home/home.component';
import { MaterialModule } from './../material.module';
import { CashRegisterFormComponent } from './Catalog/CashRegister/CashRegister.form';
import { OperationFormComponent } from './Operation/operation.form.component';
import { OperationListComponent } from './Operation/operation.list.component';

@NgModule({
  declarations: [
    AutocompleteComponent,
    HomeComponent,
    TabControllerComponent,
    BaseListComponent,
    DynamicComponentDirective,
    DynamicComponent,
    DynamicFormControlComponent,
    BaseFormComponent,
    TablePartsComponent,
    TablePartsDialogComponent,
    SuggestDialogComponent,
    RegisterMovementComponent,
    RegisterAccumulationComponent,
    RegisterAccumulationListComponent,
    FilterFormComponent,
    FilterColumnComponent,
    DynamicFilterControlComponent,

    CashRegisterFormComponent, // add user froms above
    OperationFormComponent,
    OperationListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CovalentCodeEditorModule,
  ],
  exports: [
  ],
  providers: [
    TabControllerService,
    DynamicFormService,
    DocService,
  ],
  entryComponents: [
    TablePartsDialogComponent,
    SuggestDialogComponent,
    HomeComponent,
    BaseListComponent,
    BaseFormComponent,

    CashRegisterFormComponent, // add user froms above
    OperationFormComponent,
    OperationListComponent,
    FilterColumnComponent,
  ]
})
export class DynamicFormsModule { }

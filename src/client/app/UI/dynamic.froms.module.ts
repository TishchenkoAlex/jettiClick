import { PrimeNGModule } from '../primeNG.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CovalentCodeEditorModule } from '@covalent/code-editor';
import { CashRegisterListComponent } from './Catalog/CashRegister/CashRegister.list';

import { TablePartsComponent } from '../common/datatable/table-parts.component';
import { DynamicFilterControlComponent } from '../common/filter-column/dynamic-filter-control.component';
import { FilterFormComponent } from '../common/filter/filter.component';
import { PipesModule } from '../common/pipes';
import { RegisterAccumulationComponent } from '../common/register-movements/register.accumulation.component';
import { RegisterAccumulationListComponent } from '../common/register-movements/register.accumulation.list.component';
import { RegisterInfoComponent } from '../common/register-movements/register.info.component';
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
import { AutocompletePNGComponent } from './../common/autocomplete/autocomplete.png.component';
import { TablePartsPNGComponent } from './../common/datatable/table-parts.png.component';

@NgModule({
  declarations: [
    AutocompleteComponent,
    AutocompletePNGComponent,
    HomeComponent,
    TabControllerComponent,
    BaseListComponent,
    DynamicComponentDirective,
    DynamicComponent,
    DynamicFormControlComponent,
    BaseFormComponent,
    TablePartsComponent,
    TablePartsPNGComponent,
    TablePartsDialogComponent,
    SuggestDialogComponent,
    RegisterMovementComponent,
    RegisterAccumulationComponent,
    RegisterAccumulationListComponent,
    RegisterInfoComponent,
    FilterFormComponent,
    FilterColumnComponent,
    DynamicFilterControlComponent,

    CashRegisterFormComponent, // add user froms above
    CashRegisterListComponent,
    OperationFormComponent,
    OperationListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PrimeNGModule,
    CovalentCodeEditorModule,
    PipesModule,
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
    CashRegisterListComponent,

    OperationFormComponent,
    OperationListComponent,
    FilterColumnComponent,
  ]
})
export class DynamicFormsModule { }

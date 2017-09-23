import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CovalentCodeEditorModule } from '@covalent/code-editor';

import { TablePartsComponent } from '../common/datatable/table-parts.component';
import { AutocompleteComponent } from './../common/autocomplete/autocomplete.component';
import { CommonDataTableComponent } from './../common/datatable/datatable.component';
import { DocService } from './../common/doc.service';
import { DynamicComponent, DynamicComponentDirective } from './../common/dynamic-component/dynamic-component';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';
import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { BaseFormComponent } from './../common/form/form.base.components/form.base.component';
import { RegisterMovementComponent } from './../common/register-movements/register-movement.component';
import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { TabControllerService } from './../common/tabcontroller/tabcontroller.service';
import { SuggestDialogComponent } from './../dialog/suggest.dialog.component';
import { TablePartsDialogComponent } from './../dialog/table-parts.dialog.component';
import { HomeComponent } from './../home/home.component';
import { MaterialModule } from './../material.module';
import { CashRegisterForm } from './Catalog/CashRegister/CashRegister.form';
import { OperationFormComponent } from './Operation/operation.form.component';

@NgModule({
  declarations: [
    AutocompleteComponent,
    HomeComponent,
    TabControllerComponent,
    CommonDataTableComponent,
    DynamicComponentDirective,
    DynamicComponent,
    DynamicFormControlComponent,
    BaseFormComponent,
    TablePartsComponent,
    TablePartsDialogComponent,
    SuggestDialogComponent,
    RegisterMovementComponent,

    CashRegisterForm, // add user froms above
    OperationFormComponent,
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
    CommonDataTableComponent,
    BaseFormComponent,

    CashRegisterForm, // add user froms above
    OperationFormComponent,
  ]
})
export class DynamicFormsModule { }

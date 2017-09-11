import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TablePartsComponent } from '../common/datatable/table-parts.component';
import { AutocompleteComponent } from './../common/autocomplete/autocomplete.component';
import { CommonDataTableComponent } from './../common/datatable/datatable.component';
import { DocService } from './../common/doc.service';
import { DynamicComponent, DynamicComponentDirective } from './../common/dynamic-component/dynamic-component';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';
import { DynamicFormControlService } from './../common/dynamic-form/dynamic-form-control.service';
import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { BaseFormComponent } from './../common/form/form.base.components/form.base.component';
import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { TabControllerService } from './../common/tabcontroller/tabcontroller.service';
import { SuggestDialogComponent } from './../dialog/suggest.dialog.component';
import { TablePartsDialogComponent } from './../dialog/table-parts.dialog.component';
import { HomeComponent } from './../home/home.component';
import { MaterialModule } from './../material.module';
import { CashRegisterForm } from './../UI/Catalog/CashRegister/CashRegister.form';

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

    CashRegisterForm, // add user froms above
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  exports: [
  ],
  providers: [
    TabControllerService,
    DynamicFormControlService,
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
  ]
})
export class DynamicFormsModule { }

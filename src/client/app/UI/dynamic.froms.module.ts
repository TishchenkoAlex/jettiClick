import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MaterialModule } from './../material.module';

import { DynamicComponent, DynamicComponentDirective } from './../common/dynamic-component/dynamic-component';
import { AutocompleteComponent } from './../common/autocomplete/autocomplete.component';

import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { DynamicFormControlService } from './../common/dynamic-form/dynamic-form-control.service';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';

import { CommonDataTableComponent } from './../common/datatable/datatable.component';

import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { TabControllerService } from './../common/tabcontroller/tabcontroller.service';
import { HomeComponent } from './../home/home.component';

import { BaseFormComponent } from './../common/form/form.base.components/form.base.component';

import { CashRegisterForm } from './../UI/Catalog/CashRegister/CashRegister.form';
import { TablePartsComponent } from '../common/datatable/table-parts.component';

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
  ],
  entryComponents: [
    HomeComponent,
    CommonDataTableComponent,
    BaseFormComponent,

    CashRegisterForm, // add user froms above
  ]
})
export class DynamicFormsModule { }

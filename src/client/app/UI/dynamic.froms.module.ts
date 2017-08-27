import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MaterialModule } from './../material.module';
import { CashRegisterForm } from './../UI/Catalog/CashRegister/CashRegister.form';

import { DocumentService } from './../common/dynamic-component/document.service';
import { DynamicComponentDirective } from './../common/dynamic-component/dynamic-component.directive';
import { DynamicComponent } from './../common/dynamic-component/dynamic-component';

import { DynamicFormControlService } from './../common/dynamic-form/dynamic-form-control.service';
import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';

import { CommonDataTableComponent } from './../common/datatable/datatable.component';
import { CommonFromComponent } from './../common/form/form.component';

import { HomeComponent } from './../home/home.component';
import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { AutocompleteComponent } from './../common/autocomplete/autocomplete.component';

@NgModule({
  declarations: [
    AutocompleteComponent,
    HomeComponent,
    TabControllerComponent,
    CommonDataTableComponent,
    CommonFromComponent,
    DynamicComponentDirective,
    DynamicComponent,
    DynamicFormControlComponent,

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
    DocumentService,
    DynamicFormControlService,
    DynamicFormService,
  ],
  entryComponents: [
    HomeComponent,
    CommonDataTableComponent,
    CommonFromComponent,

    CashRegisterForm, // add user froms above
  ]
})
export class DynamicFormsModule { }

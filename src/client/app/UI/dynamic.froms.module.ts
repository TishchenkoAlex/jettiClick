import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MaterialModule } from './../material.module';

import { DynamicComponentDirective } from './../common/dynamic-component/dynamic-component.directive';
import { DynamicComponent } from './../common/dynamic-component/dynamic-component';
import { AutocompleteComponent } from './../common/autocomplete/autocomplete.component';

import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { DynamicFormControlService } from './../common/dynamic-form/dynamic-form-control.service';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';

import { DocumentService } from './../common/dynamic-component/document.service';
import { CommonDataTableComponent } from './../common/datatable/datatable.component';
import { CommonFormComponent } from './../common/form/form.component';

import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { TabControllerService } from './../common/tabcontroller/tabcontroller.service';
import { HomeComponent } from './../home/home.component';

import { CashRegisterForm } from './../UI/Catalog/CashRegister/CashRegister.form';
import { CommonFormHeaderComponent } from './../common/form/form.base.components/form.header';
import { CommonFormActionsComponent } from './../common/form/form.base.components/form.actions';
import { BaseFormComponent } from './../common/form/form.base.components/form.base.component';

@NgModule({
  declarations: [
    AutocompleteComponent,
    HomeComponent,
    TabControllerComponent,
    CommonDataTableComponent,
    CommonFormComponent,
    DynamicComponentDirective,
    DynamicComponent,
    DynamicFormControlComponent,
    CommonFormHeaderComponent,
    CommonFormActionsComponent,
    BaseFormComponent,

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
    DocumentService,
  ],
  entryComponents: [
    HomeComponent,
    CommonDataTableComponent,
    CommonFormComponent,

    CashRegisterForm, // add user froms above
  ]
})
export class DynamicFormsModule { }

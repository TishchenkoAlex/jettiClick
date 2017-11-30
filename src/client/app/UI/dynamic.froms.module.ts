import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';

import { PipesModule } from '../common/pipes';
import { RegisterAccumulationComponent } from '../common/register-movements/register.accumulation.component';
import { RegisterAccumulationListComponent } from '../common/register-movements/register.accumulation.list.component';
import { RegisterInfoComponent } from '../common/register-movements/register.info.component';
import { PrimeNGModule } from '../primeNG.module';
import { AutocompletePNGComponent } from './../common/autocomplete/autocomplete.png.component';
import { BaseListComponent } from './../common/datatable/base.list.component';
import { TablePartsPNGComponent } from './../common/datatable/table-parts.png.component';
import { DocService } from './../common/doc.service';
import { DynamicComponent, DynamicComponentDirective } from './../common/dynamic-component/dynamic-component';
import { DynamicFormControlComponent } from './../common/dynamic-form/dynamic-form-control.component';
import { DynamicFormService } from './../common/dynamic-form/dynamic-form.service';
import { BaseFormComponent } from './../common/form/base.form.components/base.form.component';
import { RegisterMovementComponent } from './../common/register-movements/register-movement.component';
import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';
import { TabControllerService } from './../common/tabcontroller/tabcontroller.service';
import { SuggestDialogComponent } from './../dialog/suggest.dialog.component';
import { HomeComponent } from './../home/home.component';
import { MaterialModule } from './../material.module';
import { OperationFormComponent } from './Operation/operation.form.component';
import { OperationListComponent } from './Operation/operation.list.component';

@NgModule({
  declarations: [
    AutocompletePNGComponent,
    HomeComponent,
    TabControllerComponent,
    BaseListComponent,
    DynamicComponentDirective,
    DynamicComponent,
    DynamicFormControlComponent,
    BaseFormComponent,
    TablePartsPNGComponent,
    SuggestDialogComponent,
    RegisterMovementComponent,
    RegisterAccumulationComponent,
    RegisterAccumulationListComponent,
    RegisterInfoComponent,

    OperationFormComponent,
    OperationListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MonacoEditorModule,
    PipesModule,
    PrimeNGModule,
  ],
  exports: [
  ],
  providers: [
    TabControllerService,
    DynamicFormService,
    DocService,
  ],
  entryComponents: [
    SuggestDialogComponent,
    HomeComponent,
    BaseListComponent,
    BaseFormComponent,

    OperationFormComponent,
    OperationListComponent,
  ]
})
export class DynamicFormsModule { }

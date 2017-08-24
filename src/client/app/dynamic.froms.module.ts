import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MaterialModule } from './material.module';
import { CashRegisterForm } from './UI/Catalog/CashRegister/CashRegister.form';


@NgModule({
  declarations: [
    CashRegisterForm
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    MaterialModule,
  ],
  providers: [
  ],
  entryComponents: [
    CashRegisterForm
  ]
})
export class DynamicFormsModule { }

import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { BaseFormComponent } from '../../../common/form/form.base.components/form.base.component';

@Component({
  templateUrl: 'CashRegister.form.html',
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm extends BaseFormComponent  {

  Save() {
    console.log('Master SAVE');
    super.Save();
  }

}

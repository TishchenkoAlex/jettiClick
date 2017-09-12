import { Component } from '@angular/core';

import { BaseFormComponent } from '../../../common/form/form.base.components/form.base.component';

@Component({
  templateUrl: 'CashRegister.form.html',
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm extends BaseFormComponent  {

  Save() {
    console.log('CHILD SAVE');
    super.Save();
  }

}

import { Component } from '@angular/core';
import { DocumentService } from '../../../common/dynamic-component/document.service';
import { Location } from '@angular/common';
import { BaseFormComponent } from '../../../common/form/form.base.components/form.base.component';

@Component({
  templateUrl: 'CashRegister.form.html',
  providers: [
    DocumentService,
  ]
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm extends BaseFormComponent  {

}



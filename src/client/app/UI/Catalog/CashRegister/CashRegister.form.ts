import { NgForm } from '@angular/forms';
import { Component, OnChanges, OnInit } from '@angular/core';
import { CommonFromComponent } from '../../../common/form/form.component';

@Component({
  templateUrl: 'CashRegister.form.html'
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm extends CommonFromComponent  {

  onSubmit() {
    console.log('SUBMIT');
    super.onSubmit();
  }
}

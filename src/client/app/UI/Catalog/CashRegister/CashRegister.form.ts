import { FormGroup, NgForm } from '@angular/forms';
import { Component, OnChanges, OnInit, TemplateRef } from '@angular/core';
import { CommonFromComponent } from '../../../common/form/form.component';

@Component({
  templateUrl: 'CashRegister.form.html',
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm extends CommonFromComponent implements OnInit  {

  ngOnInit() {
    this.afterPost$ = this.ds.afterPost$
    .filter(doc => doc.id === this.data.docID)
    .subscribe(doc => {
      this.ds.onChange(doc)
      console.log('POSTED TO', doc);
    });
  }
}

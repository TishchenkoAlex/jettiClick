import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm, FormGroup } from '@angular/forms';
import { DocModel } from '../../../common/_doc.model';

@Component({
  // tslint:disable-next-line:component-selector
  templateUrl: 'CashRegister.form.html',
  styleUrls: ['CashRegister.form.scss']
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm implements OnInit, AfterViewInit {

  @Input() model = new DocModel('Catalog.Managers');

  @ViewChild('form') form: NgForm;

  ngOnInit() {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.form.form.valueChanges
        .subscribe(data => console.log('valueChanges', data))
    });
  }

  onSubmit(form: NgForm) {
  }

}

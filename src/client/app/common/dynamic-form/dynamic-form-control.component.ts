import { AfterViewInit, Component, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { BaseJettiFromControl } from './dynamic-form-base';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.html',
  styles: [`md-spinner {width: 13px; height: 13px; position: relative; top: 2px; left: 0px; opacity: 1.0;}`]
})
export class DynamicFormControlComponent implements AfterViewInit {
  @Input() control: BaseJettiFromControl<any>;
  @Input() form: FormGroup;
  @Input() tab: any;

  get isValid() { return this.form.controls[this.control.key].valid; }

  ngAfterViewInit() {
    Promise.resolve().then(() => {
      if (this.control.controlType === 'autocomplete') {
        this.form.controls[this.control.key].setValidators(this.validateAutoComplete.bind(this));
      }
    });
  }

  validateAutoComplete(control: FormControl): { [s: string]: boolean } {
    const result = (control.value.value === '' && this.control.required === true);
    if (result) { return { 'value is required': result }; };
    return null;
  }

  get getControls(): FormArray { return this.form.get(this.control.key) as FormArray };

}


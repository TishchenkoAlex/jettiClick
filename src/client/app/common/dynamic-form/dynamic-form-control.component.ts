import { Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { BaseJettiFromControl } from './dynamic-form-base';
import { patchOptionsNoEvents } from './dynamic-form.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.html',
  styles: [`md-spinner {width: 13px; height: 13px; position: relative; top: 2px; left: 0px; opacity: 1.0;}`]
})
export class DynamicFormControlComponent {
  @Input() control: BaseJettiFromControl<any>;
  @Input() form: FormGroup;
  @Input() tab: any;

  get isValid() { return this.form.controls[this.control.key].valid; }

  get getControls(): FormArray { return this.form.get(this.control.key) as FormArray };

  onChange(event) {
    if (this.control.change) {
      const func = new Function('doc, value', this.control.change);
      const patch = func(this.form.value, this.form.controls[this.control.key].value);
      (this.form as FormGroup).patchValue(patch, patchOptionsNoEvents);
    }
  }

}


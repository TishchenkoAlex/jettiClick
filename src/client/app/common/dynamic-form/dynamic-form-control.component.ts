import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { BaseJettiFromControl } from './dynamic-form-base';
import { patchOptionsNoEvents } from './dynamic-form.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.html'
})
export class DynamicFormControlComponent {
  @Input() control: BaseJettiFromControl<any>;
  @Input() form: FormGroup;

  constructor (public api: ApiService) {}

  get getControls(): FormArray { return this.form.get(this.control.key) as FormArray };

  async onChange(event) {
    if (this.control.change) {
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const func = new AsyncFunction('doc, value, prop, call', this.control.change);
      const patch = await func(
        this.form.getRawValue(), this.form.controls[this.control.key].value, this.control.key, this.api.call.bind(this.api));
      this.form.patchValue(patch, patchOptionsNoEvents);
    }
  }

}


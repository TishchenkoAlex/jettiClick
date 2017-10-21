import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { BaseJettiFromControl } from './dynamic-form-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.html'
})
export class DynamicFormControlComponent {
  @Input() control: BaseJettiFromControl<any>;
  @Input() form: FormGroup;

  constructor(public api: ApiService) { }

  get getControls(): FormArray { return this.form.get(this.control.key) as FormArray };

  onChange(event) {
    Promise.resolve().then(async () => {
      if (this.control.change) {
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const func = new AsyncFunction('doc, prop, value, call', this.control.change);
        const patch = await func(
          this.form.getRawValue(),
          this.control.key,
          this.form.controls[this.control.key].value,
          this.api.valueChanges.bind(this.api));
        this.form.patchValue(patch, { emitEvent: false, onlySelf: true });
        console.log('CALL', patch);
      }
    });
  }
}

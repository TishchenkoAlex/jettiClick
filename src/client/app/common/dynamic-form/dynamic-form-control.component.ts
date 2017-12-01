import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import locale from '@angular/common/locales/ru';

import { ApiService } from '../../services/api.service';
import { BaseJettiFromControl } from './dynamic-form-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.png.html'
})
export class DynamicFormControlComponent {
  @Input() control: BaseJettiFromControl<any>;
  @Input() form: FormGroup;

  formatDate = 'dd.mm.yy';
  locale = {
    firstDayOfWeek: 1,
    dayNames: locale[3][2],
    dayNamesShort: locale[3][0],
    dayNamesMin: locale[3][0],
    monthNames: locale[5][2],
    monthNamesShort: locale[5][1],
    today: 'Today',
    clear: 'Clear'
  };

  constructor(public api: ApiService) {}

  get getControls(): FormArray { return this.form.get(this.control.key) as FormArray };

  async onChange(event: Event) {
    if (this.control.change) {
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const func = new AsyncFunction('doc, prop, value, call', this.control.change);
      const patch = await func(
        this.form.getRawValue(),
        this.control.key,
        this.form.controls[this.control.key].value,
        this.api.valueChanges.bind(this.api));
      console.log('valueChanges', patch);
      this.form.patchValue(patch);
    }
  }
}

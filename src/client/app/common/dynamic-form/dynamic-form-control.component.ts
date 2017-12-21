import locale from '@angular/common/locales/ru';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { BaseJettiFormControl } from './dynamic-form-base';
import { calendarLocale, dateFormat } from './../../primeNG.module';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.png.html'
})
export class DynamicFormControlComponent {
  @Input() control: BaseJettiFormControl<any>;
  @Input() form: FormGroup;
  locale = calendarLocale;
  dateFormat = dateFormat;

  constructor(public api: ApiService) { }

  get getControls(): FormArray { return this.form.get(this.control.key) as FormArray };

  onChange(event: Event) {

    if (this.control.onChange) {
      const patch = this.control.onChange(
        this.form.getRawValue(),
        this.form.controls[this.control.key].value);
      console.log(this.control.key, patch);
      if (patch) {
        this.form.patchValue(patch);
      }
    }

    if (this.control.onChangeServer) {
      this.api.valueChanges(
        this.form.getRawValue(),
        this.control.key,
        this.form.controls[this.control.key].value).then(patch => {
          console.log(this.control.key, patch);
          if (patch) {
            this.form.patchValue(patch);
          }
        })
    }

  }
}

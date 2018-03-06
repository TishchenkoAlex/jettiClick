import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { calendarLocale, dateFormat } from './../../primeNG.module';
import { FormControlInfo } from './dynamic-form-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.html'
})
export class DynamicFormControlComponent implements OnInit {
  @Input() control: FormControlInfo;
  @Input() form: FormGroup;
  floatLabel = 'auto';
  description = '';

  locale = calendarLocale; dateFormat = dateFormat;

  constructor(public api: ApiService) { }

  ngOnInit() {
    this.floatLabel = this.control.showLabel ? 'auto' : 'never';
    this.description = this.form['metadata'] ? this.form['metadata'].description : '';
  }

  onChange(event: Event) {
    if (this.control.onChange) {
      const patch = this.control.onChange(
        this.form.getRawValue(),
        this.form.controls[this.control.key].value
      );
      // console.log(this.control.key, patch);
      if (patch) { this.form.patchValue(patch); }
    }

    if (this.control.onChangeServer) {
      this.api.valueChanges(
        this.form.getRawValue(),
        this.control.key,
        this.form.controls[this.control.key].value)
        .then(patch => {
          // console.log(this.control.key, patch);
          if (patch) { this.form.patchValue(patch); }
        });
    }
  }
}

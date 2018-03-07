import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

import { ApiService } from '../../services/api.service';
import { calendarLocale, dateFormat } from './../../primeNG.module';
import { FormControlInfo } from './dynamic-form-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: './dynamic-form-control.component.html'
})
export class DynamicFormControlComponent implements OnInit, OnDestroy {
  @Input() control: FormControlInfo;
  @Input() form: FormGroup;
  floatLabel = 'auto';
  description = '';

  locale = calendarLocale; dateFormat = dateFormat;
  valueChanges$: Subscription = Subscription.EMPTY;

  constructor(public api: ApiService) { }

  ngOnInit() {
    this.floatLabel = this.control.showLabel ? 'auto' : 'never';
    this.description = this.form['metadata'] ? this.form['metadata'].description : '';
    this.valueChanges$ = this.form.get(this.control.key).valueChanges
      .subscribe(data => this.onChange(null));
  }

  ngOnDestroy() {
    this.valueChanges$.unsubscribe();
  }

  onChange(event: Event) {
    if (this.control.onChange) {
      const func = (new Function('return ' + this.control.onChange.toString())() as Function);
      const patch = func(
        this.form.getRawValue(),
        this.form.controls[this.control.key].value
      );
      if (patch) { this.form.patchValue(patch, { emitEvent: false }); }
    }

    if (this.control.onChangeServer) {
      this.api.valueChanges(
        this.form.getRawValue(),
        this.control.key,
        this.form.controls[this.control.key].value)
        .then(patch => {
          if (patch) { this.form.patchValue(patch, { emitEvent: false }); }
        });
    }
  }
}

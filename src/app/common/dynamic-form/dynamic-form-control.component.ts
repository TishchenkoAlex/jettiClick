import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

import { ApiService } from '../../services/api.service';
import { calendarLocale, dateFormat } from './../../primeNG.module';
import { FormControlInfo } from './dynamic-form-base';
import { patchOptionsNoEvents } from './dynamic-form.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: 'dynamic-form-control.component.html'
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
    const formControl = this.form.get(this.control.key);
    if (formControl) this.valueChanges$ = formControl.valueChanges.subscribe(async value => {
      if (this.control.onChange) {
        const funcBody = this.control.onChange.toString()
          .match(/function[^{]+\{([\s\S]*)\}$/)[1]
          .replace(/\api\./g, 'await api.');
        const func = new Function('doc, value, api, body', `
          var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          var func = new AsyncFunction('doc, value, api', body);
          return func(doc, value, api, body);
        `);
        const patch = await func(this.form.getRawValue(), value, this.api, funcBody);
        this.form.patchValue(patch || {}, patchOptionsNoEvents);
      }

      if (this.control.onChangeServer) {
        this.api.valueChanges(this.form.getRawValue(), this.control.key, value)
          .then(patch => this.form.patchValue(patch || {}, patchOptionsNoEvents));
      }
    });
  }

  ngOnDestroy() {
    this.valueChanges$.unsubscribe();
  }

}

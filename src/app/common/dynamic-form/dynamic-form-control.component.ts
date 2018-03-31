import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from '../../services/api.service';
import { FormControlInfo } from './dynamic-form-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-control',
  templateUrl: 'dynamic-form-control.component.html'
})
export class DynamicFormControlComponent implements OnInit, OnDestroy {
  @Input() control: FormControlInfo;
  @Input() form: FormGroup;
  formControl: AbstractControl;

  valueChanges$: Subscription = Subscription.EMPTY;

  constructor(public api: ApiService) { }

  ngOnInit() {
    this.formControl = this.form.get(this.control.key)!;
    if (this.formControl && (this.control.onChange || this.control.onChangeServer))
      this.valueChanges$ = this.formControl.valueChanges.subscribe(async value => {

        if (this.control.onChange) {
          const funcBody = ((this.control.onChange.toString().match(/function[^{]+\{([\s\S]*)\}$/)) || [])[1]
            .replace(/\api\./g, 'await api.');
          const func = new Function('doc, value, api, body', `
            var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            var func = new AsyncFunction('doc, value, api', body);
            return func(doc, value, api, body);
            `);
          const patch = await func(this.form.getRawValue(), value, this.api, funcBody);
          this.form.patchValue(patch || {});
        }

        if (this.control.onChangeServer) {
          this.api.valueChanges(this.form.getRawValue(), this.control.key, value)
            .then(patch => this.form.patchValue(patch || {}));
        }
      });
  }

  parseDate(dateString: string) {
    const date = dateString ? new Date(dateString) : null;
    this.formControl.setValue(date);
  }

  marginTop() {
    if (!this.control.showLabel) return;
    if (this.control.type === 'datetime' || this.control.type === 'date') return '24px'; else return '24px';
  }

  ngOnDestroy() {
    this.valueChanges$.unsubscribe();
  }

}

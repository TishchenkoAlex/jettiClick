import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';

import { BaseDynamicControl } from './dynamic-form-base';

@Injectable()
export class DynamicFormControlService {

  toFormGroup(controls: BaseDynamicControl<any>[]) {
    const group: any = {};

    controls.forEach(control => {
      if (control.controlType === 'table') {
        const Row = {};
        const arr: FormGroup[] = [];
        (control.value as BaseDynamicControl<any>[]).forEach(item => {
          Row[item.key] = item.required ?
            new FormControl(item.value, Validators.required) : new FormControl(item.value);
        });
        arr.push(new FormGroup(Row));
        group[control.key] = new FormArray(arr);
      } else {
        group[control.key] = control.required ?
          new FormControl(control.value, Validators.required) : new FormControl(control.value);
      }
    });
    return new FormGroup(group);
  }
}

import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';

import { BaseDynamicControl } from './dynamic-form-base';

@Injectable()
export class DynamicFormControlService {

  toFormGroup(controls: BaseDynamicControl<any>[]) {
    const group: any = {};

    controls.forEach(control => {
      if (control.controlType === 'table') {
        const arr: AbstractControl[] = [];
        control.value.forEach(item => {
          arr.push(new FormControl(item.value));
        });
        group[control.key] = new FormArray(arr);
      } else {
        group[control.key] = control.required ?
          new FormControl(control.value, Validators.required) : new FormControl(control.value);
      }
    });
    return new FormGroup(group);
  }
}

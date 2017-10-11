import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';

import { BaseJettiFromControl, TableDynamicControl } from './dynamic-form/dynamic-form-base';

export function copyFormGroup(formGroup: FormGroup): FormGroup {
  const newFormGroup = new FormGroup({});
  Object.keys(formGroup.controls).forEach(key => {
    const sourceFormControl = formGroup.controls[key];
    const newValue = sourceFormControl.value && typeof sourceFormControl.value === 'object' ?
      Object.assign({}, sourceFormControl.value) : sourceFormControl.value;
    const newFormControl = sourceFormControl.validator ?
      new FormControl(newValue, Validators.required) :
      new FormControl(newValue);
    newFormGroup.addControl(key, newFormControl);
  });
  return newFormGroup;
}

export function toFormGroup(controls: BaseJettiFromControl<any>[]) {
  const group: any = {};

  controls.forEach(control => {
    if (control instanceof TableDynamicControl) {
      const Row = {};
      const arr: FormGroup[] = [];
      (control.value as BaseJettiFromControl<any>[]).forEach(item => {
        Row[item.key] = item.required ?
          new FormControl(item.value, Validators.required) : new FormControl(item.value);
      });
      arr.push(new FormGroup(Row));
      group[control.key] = control.required ?
        new FormArray(arr, Validators.required) : new FormArray(arr);
    } else {
      group[control.key] = control.required ?
        new FormControl(control.value, Validators.required) : new FormControl(control.value);
    }
  });
  const result = new FormGroup(group);
  return result;
}

export function getPeriod(value: string): { startDate: Date, endDate: Date } {
  switch (value) {
    case 'td': {
      return {
        startDate: moment().startOf('day').toDate(),
        endDate: moment().endOf('day').toDate()
      };
    }
    case '7d': {
      return { startDate: moment().add(-7, 'day').toDate(), endDate: new Date() };
    }
    case 'tw': {
      return { startDate: moment().startOf('week').toDate(), endDate: new Date() };
    }
    case 'lw': {
      return {
        startDate: moment().startOf('week').add(-1, 'week').toDate(),
        endDate: moment().endOf('week').add(-1, 'week').toDate()
      };
    }
    case 'tm': {
      return { startDate: moment().startOf('month').toDate(), endDate: new Date() };
    }
    case 'lm': {
      return {
        startDate: moment().startOf('month').add(-1, 'month').toDate(), endDate: new Date()
      };
    }
    case 'ty': {
      return { startDate: moment().startOf('year').toDate(), endDate: new Date() };
    }
    case 'ly': {
      return {
        startDate: moment().startOf('year').add(-1, 'year').toDate(),
        endDate: moment().endOf('year').add(-1, 'year').toDate()
      };
    }
    default: {
      return { startDate: moment().startOf('week').toDate(), endDate: new Date() };
    }
  }
}

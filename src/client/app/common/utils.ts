import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';

import { dateReviver } from './../../../server/fuctions/dateReviver';

export function cloneFormGroup(formGroup: FormGroup): FormGroup {
  const newFormGroup = new FormGroup({});
  Object.keys(formGroup.controls).forEach(key => {
    const sourceFormControl = formGroup.controls[key];
    const newValue = JSON.parse(JSON.stringify(sourceFormControl.value), dateReviver);
    const newFormControl = sourceFormControl.validator ?
      new FormControl(newValue, Validators.required) :
      new FormControl(newValue);
    newFormGroup.addControl(key, newFormControl);
  });
  return newFormGroup;
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

import { Inject, Injectable, Optional } from '@angular/core';
import { MAT_DATE_LOCALE, MD_DATE_FORMATS, NativeDateAdapter } from '@angular/material';
import * as moment from 'moment';

@Injectable()
export class JettiDateAdapter extends NativeDateAdapter {

  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string,
    @Optional() @Inject(MD_DATE_FORMATS) private matDateFormats) {
    super(matDateLocale);
  }

  parse(value: any): Date | null {
    if (value && typeof value === 'string') {
      return moment(value, 'DD.MM.YYYY', true).toDate();
    }
    return value ? moment(value).locale(this.matDateFormats.parse.dateInput).toDate() : null;
  }

}

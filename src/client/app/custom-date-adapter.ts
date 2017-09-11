import { NativeDateAdapter } from '@angular/material';
import * as moment from 'moment';

/** Adapts the native JS Date for use with cdk-based components that work with dates. */
export class CustomDateAdapter extends NativeDateAdapter {

  parse(value: any): Date | null {
    // We use momentjs to parse format or locale.
    const date = moment(value, 'DD.MM.YYYY', true);
    if (date.isValid() ) {
      return date.add(12, 'hours').toDate();
    }
    return null;
  }

  isDateInstance(obj: any): boolean {
    return moment(obj, 'DD.MM.YYYY', true).isValid();
  }

  isValid(date: Date): boolean {
    return this.isDateInstance(date);
  }

}

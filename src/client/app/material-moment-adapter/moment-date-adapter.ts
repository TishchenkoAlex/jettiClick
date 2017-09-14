import {Inject, Injectable, Optional} from '@angular/core';
import {DateAdapter, MAT_DATE_LOCALE} from '@angular/material';

import * as _moment from 'moment';
import { Moment } from 'moment';
const moment = _moment;

/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}

/** Adapts Moment.js Dates for use with Angular Material. */
@Injectable()
export class MomentDateAdapter extends DateAdapter<Moment> {

  private _localeData: {
    firstDayOfWeek: number,
    longMonths: string[],
    shortMonths: string[],
    dates: string[],
    longDaysOfWeek: string[],
    shortDaysOfWeek: string[],
    narrowDaysOfWeek: string[]
  };

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) dateLocale: string) {
    super();
    this.setLocale(dateLocale || moment.locale());
  }

  setLocale(locale: string) {
    super.setLocale(locale);

    const momentLocaleData = moment.localeData(locale);
    this._localeData = {
      firstDayOfWeek: momentLocaleData.firstDayOfWeek(),
      longMonths: momentLocaleData.months(),
      shortMonths: momentLocaleData.monthsShort(),
      dates: range(31, (i) => this.createDate(2017, 0, i + 1).format('D')),
      longDaysOfWeek: momentLocaleData.weekdays(),
      shortDaysOfWeek: momentLocaleData.weekdaysShort(),
      narrowDaysOfWeek: momentLocaleData.weekdaysMin(),
    };
  }

  getYear(date: Moment): number {
    return this.clone(date).year();
  }

  getMonth(date: Moment): number {
    return this.clone(date).month();
  }

  getDate(date: Moment): number {
    return this.clone(date).date();
  }

  getDayOfWeek(date: Moment): number {
    return this.clone(date).day();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    // Moment.js doesn't support narrow month names, so we just use short if narrow is requested.
    return style === 'long' ? this._localeData.longMonths : this._localeData.shortMonths;
  }

  getDateNames(): string[] {
    return this._localeData.dates;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (style === 'long') {
      return this._localeData.longDaysOfWeek;
    }
    if (style === 'short') {
      return this._localeData.shortDaysOfWeek;
    }
    return this._localeData.narrowDaysOfWeek;
  }

  getYearName(date: Moment): string {
    return this.clone(date).format('YYYY');
  }

  getFirstDayOfWeek(): number {
    return this._localeData.firstDayOfWeek;
  }

  getNumDaysInMonth(date: Moment): number {
    return this.clone(date).daysInMonth();
  }

  clone(date: Moment): Moment {
    return moment(new Date(date.toString()));
  }

  createDate(year: number, month: number, date: number): Moment {

    return moment(new Date(year, month, date));
  }

  today(): Moment {
    return moment().locale(this.locale);
  }

  parse(value: any, parseFormat: string | string[]): Moment | null {
    if (value && typeof value === 'string') {
      return moment(value, parseFormat, this.locale, true);
    }
    return value ? moment(value).locale(this.locale) : null;
  }

  format(date: Moment, displayFormat: string): string {
    date = this.clone(date);
    if (!this.isValid(date)) {
      throw Error('MomentDateAdapter: Cannot format invalid date.');
    }
    return date.format(displayFormat);
  }

  addCalendarYears(date: Moment, years: number): Moment {
    return this.clone(date).add({years});
  }

  addCalendarMonths(date: Moment, months: number): Moment {
    return this.clone(date).add({months});
  }

  addCalendarDays(date: Moment, days: number): Moment {
    return this.clone(date).add({days});
  }

  getISODateString(date: Moment): string {
    return this.clone(date).format();
  }

  isDateInstance(obj: any): boolean {
    return moment(obj).isValid();
  }

  isValid(date: Moment): boolean {
    return this.isDateInstance(date);
  }
}

import * as moment from 'moment';

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


export function scrollIntoViewIfNeeded(type, style, direction = false) {
  let target;
  const highlight = document.getElementsByClassName(`scrollTo-${type} ${style}`);
  if (highlight.length) target = highlight[highlight.length - 1];
  else {
    const items = document.getElementsByClassName(`scrollTo-${type}`);
    if (items.length) target = items[0];
  }
  if (!target) return;
  const rect = target.getBoundingClientRect();
  if (rect.bottom > window.innerHeight) return target.scrollIntoView(direction ? true : false);
  if (rect.top <= 0) return target.scrollIntoView(direction ? false : true);
  if (direction) return target.scrollIntoView(false);
}

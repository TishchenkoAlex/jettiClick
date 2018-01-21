export class UserSettings {
  formListSettings: { [x: string]: FormListSettings } = { '': new FormListSettings() };
  defaults = new UserDefaultsSettings();
}

export class UserDefaultsSettings {
  company: string = null;
  department: string = null;
  rowsInList = 14;
}

export class FilterInterval {
  start: number | string | boolean = null;
  end: number | string | boolean = null;
}

export type FilterList = number[] | string[];

export type matchOperator = '=' | '>=' | '<=' | '<' | '>' | 'like' | 'in' | 'beetwen';

export class FormListFilter {
  left: string;
  center: matchOperator = '=';
  right: any = null;

  constructor (field: string) {
    this.left = field;
  }
}

export class FormListOrder {
  order: 'asc' | 'desc' | ''  = '';

  constructor (public field: string) {}
}

export class FormListSettings {
  filter: FormListFilter[] = [];
  order: FormListOrder[] = [];
}


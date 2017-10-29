export class UserSettings {
  formListSettings: { [x: string]: FormListSettings } = { '': new FormListSettings() };
  defaults = new UserDefaultsSettings();
}

export class UserDefaultsSettings {
  company: string = null
  department: string = null;
  rowsInList = 14;
}

export class FilterInterval {
  start: number | string | boolean = null;
  end: number | string | boolean = null;
}

export type FilterList = number[] | string[];

export class FormListFilter {
  left: string;
  center: '=' | '>=' | '<=' | 'like' | 'in' | 'beetwen' = '='
  right: number | string | FilterList | boolean | FilterInterval = null;

  constructor (field: string) {
    this.left = field;
  };
}

export class FormListOrder {
  order: 'asc' | 'desc' | ''  = '';

  constructor (public field: string) {};
}

export class FormListSettings {
  filter: FormListFilter[] = [];
  order: FormListOrder[] = [];
}

const userSettings: UserSettings = {
  formListSettings: {
    'Catalog.ClientOrder': {
      filter: [
        { left: 'Client', center: 'like', right: 'Client' },
        { left: 'date', center: 'beetwen', right: { start: '2015-01-01', end: '2017-01-01' } }
      ],
      order: [
        { field: 'Amount', order: 'asc' }
      ]
    }
  },
  defaults: {
    company: 'NATUSA',
    department: null,
    rowsInList: 15
  }
}

export interface UserSettings {
  formListSettings: { [x: string]: FormListSettings },
  defaults: {
    company?: string
    department?: string
  }
}

export interface FormListFilter {
  left: string,
  center: '=' | '>=' | '<=' | 'like' | 'in' | 'beetwen',
  right: number | string | any[] | boolean | { 'start': string | number, 'end': string | number }
}

export interface FormListOrder { fileld: string, order: 'asc' | 'desc' }

export class FormListSettings {
  filter: FormListFilter[];
  order: FormListOrder[];
}

const userSettings: UserSettings = {
  formListSettings: {
    'Catalog.ClientOrder': {
      filter: [
        { left: 'Client', center: 'like', right: 'Client' }
      ],
      order: [
        { fileld: 'Amount', order: 'asc' }
      ]
    }
  },
  defaults: {
    company: 'NATUSA',
    department: null
  }
}


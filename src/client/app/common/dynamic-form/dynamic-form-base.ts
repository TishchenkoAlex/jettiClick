export interface ControlOptions<T> {
  value?: T,
  type?: string,
  key?: string,
  label?: string,
  required?: boolean,
  readOnly?: boolean,
  hidden?: boolean,
  order?: number,
  controlType?: string,
  style?: any,
  change?: string,
}

export class BaseJettiFromControl<T> {
  value: T;
  type: string;
  key: string;
  label: string;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  order: number;
  controlType: string;
  style: any;
  change: string;

  constructor(options: ControlOptions<T> = {}) {
    this.value = options.value;
    this.type = options.type || '';
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.readOnly = !!options.readOnly;
    this.hidden = !!options.hidden;
    this.order = options.order === undefined ? 9999999 : options.order;
    this.controlType = options.controlType || '';
    this.style = options.style || {};
    this.change = options.change || '';
  }
}

export class TextboxJettiFormControl extends BaseJettiFromControl<string> {
  controlType = 'textbox';
  type = 'string';

  constructor(options: ControlOptions<string> = {}) {
    super(options);

  }
}

export class TextareaJettiFormControl extends BaseJettiFromControl<string> {
  controlType = 'textarea';
  type = 'string';

  constructor(options: ControlOptions<string> = {}) {
    super(options);

  }
}

export class ScriptJettiFormControl extends BaseJettiFromControl<string> {
  controlType = 'script';
  style = { 'height': '150px', 'width': '500px' };

  constructor(options: ControlOptions<string> = {}) {
    super(options);
    if (options.style) { this.style = options.style };
  }
}

export class BooleanJettiFormControl extends BaseJettiFromControl<boolean> {
  controlType = 'checkbox';
  type = 'boolean';
  style = { 'max-width': '45px', 'min-width': '24px', 'text-align' : 'center', 'justify-content': 'center' };

  constructor(options: ControlOptions<boolean> = {}) {
    super(options);
    if (typeof this.value !== 'boolean') { this.value = false; }
    if (options.style) { this.style = options.style };
  }
}

export class DateJettiFormControl extends BaseJettiFromControl<Date> {
  controlType = 'date';
  type = 'date';
  style = { 'max-width' : '90px' };

  constructor(options: ControlOptions<Date> = {}) {
    super(options);
    if (options.style) { this.style = options.style };
  }
}

export class DateTimeDynamicControl extends BaseJettiFromControl<Date> {
  controlType = 'datetime';
  type = 'datetime';
  style = { 'max-width' : '110px' };

  constructor(options: ControlOptions<Date> = {}) {
    super(options);
    if (options.style) { this.style = options.style };
  }
}

export interface JettiComplexObject {
  id: string, value: string, code: string, type: string, data?: any
}

export class AutocompleteJettiFormControl extends BaseJettiFromControl<JettiComplexObject> {
  controlType = 'autocomplete';

  constructor(options: ControlOptions<JettiComplexObject> = {}) {
    super(options);
    if (!this.value) {
      this.value = {id: '',  code: '', type: this.type, value: ''}
    }
  }
}

export class NumberJettiFormControl extends BaseJettiFromControl<number> {
  controlType = 'number';
  type = 'number';
  style = { 'max-width' : '110px' };

  constructor(options: ControlOptions<number> = {}) {
    super(options);
    if (options.style) { this.style = options.style }
  }
}

export class TableDynamicControl extends BaseJettiFromControl<Object> {
  controlType = 'table';
  type = 'table';

  constructor(options: ControlOptions<Object> = {}) {
    super(options);
  }
}

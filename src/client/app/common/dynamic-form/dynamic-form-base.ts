export type ControlTypes = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'table';

export interface IFormControlInfo {
  value?: any;
  type?: string;
  key?: string;
  label?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  order?: number;
  controlType?: string;
  style?: any;
  owner?: { dependsOn: string, filterBy: string };
  totals?: number;
  change?: string;
  onChange?: (doc, value) => Promise<any>;
  onChangeServer?: boolean;
}

export class FormControlInfo {
  value: any;
  type: string;
  key: string;
  label: string;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  disabled?: boolean;
  order: number;
  controlType: string;
  style: any;
  owner?: { dependsOn: string, filterBy: string };
  totals: number;
  showLabel = true;
  change?: string;
  onChange?: (doc, value) => Promise<any>;
  onChangeServer?: boolean;

  constructor(options: IFormControlInfo = {}) {
    this.value = options.value || null;
    this.type = options.type;
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.readOnly = !!options.readOnly;
    this.hidden = !!options.hidden;
    this.disabled = !!options.disabled;
    this.order = options.order === undefined ? 9999999 : options.order;
    this.controlType = options.controlType;
    this.style = options.style || { 'width': '200px', 'min-width': '200px', 'max-width': '200px' };
    this.totals = options.totals || null;
    this.owner = options.owner;
    this.onChange = options.onChange;
    this.onChangeServer = options.onChangeServer;
    this.change = options.change;
    if (this.change && !this.onChange) {
      this.onChange = new Function('doc', 'value', options.change) as any;
    }
  }
}

export class TextboxFormControl extends FormControlInfo {
  controlType = 'string';
  type = 'string';

  constructor(options: IFormControlInfo = {}) {
    super(options);
  }
}

export class TextareaFormControl extends FormControlInfo {
  controlType = 'textarea';
  type = 'string';
  style = { 'min-width': '100%' };

  constructor(options: IFormControlInfo = {}) {
    super(options);
  }
}

export class ScriptFormControl extends FormControlInfo {
  controlType = 'script';
  style = { 'width': '500px', 'min-width': '500px', 'max-width': '500px'};

  constructor(options: IFormControlInfo = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class BooleanFormControl extends FormControlInfo {
  controlType = 'boolean';
  type = 'boolean';
  style = { 'min-width': '24px', 'max-width': '24px', 'width': '90px', 'text-align': 'center' };

  constructor(options: IFormControlInfo = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class DateJettiFormControl extends FormControlInfo {
  controlType = 'date';
  type = 'date';
  style = { 'min-width': '110px', 'max-width': '110px', 'width': '110px' };

  constructor(options: IFormControlInfo = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class DateTimeFormControl extends FormControlInfo {
  controlType = 'datetime';
  type = 'datetime';
  style = { 'min-width': '145px', 'max-width': '145px', 'width': '145px' };

  constructor(options: IFormControlInfo = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export interface JettiComplexObject {
  id: string; value: string; code: string; type: string; data?: any;
}

export class AutocompleteFormControl extends FormControlInfo {
  controlType = 'autocomplete';
  style = { 'width': '250px', 'min-width': '250px', 'max-width': '250px'};
  value: JettiComplexObject = { id: null, code: null, type: this.type, value: null };

  constructor(options: IFormControlInfo = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class NumberFormControl extends FormControlInfo {
  controlType = 'number';
  type = 'number';
  style = {'min-width': '100px', 'max-width': '100px', 'width': '100px', 'text-align': 'right' };

  constructor(options: IFormControlInfo = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class TableDynamicControl extends FormControlInfo {
  controlType = 'table';
  type = 'table';
  controls: FormControlInfo[] = [];

  constructor(options: IFormControlInfo = {}) {
    super(options);
  }
}

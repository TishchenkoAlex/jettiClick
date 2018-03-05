export interface ControlOptions {
  value?: any;
  type?: string;
  key?: string;
  label?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
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
  order: number;
  controlType: string;
  style: any;
  owner?: { dependsOn: string, filterBy: string };
  totals: number;
  showLabel = true;
  change?: string;
  onChange?: (doc, value) => Promise<any>;
  onChangeServer?: boolean;

  constructor(options: ControlOptions = {}) {
    this.value = options.value || null;
    this.type = options.type;
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.readOnly = !!options.readOnly;
    this.hidden = !!options.hidden;
    this.order = options.order === undefined ? 9999999 : options.order;
    this.controlType = options.controlType;
    this.style = options.style || { 'width': '200px'};
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

export class TextboxJettiFormControl extends FormControlInfo {
  controlType = 'string';
  type = 'string';

  constructor(options: ControlOptions = {}) {
    super(options);
  }
}

export class TextareaJettiFormControl extends FormControlInfo {
  controlType = 'textarea';
  type = 'string';

  constructor(options: ControlOptions = {}) {
    super(options);
  }
}

export class ScriptJettiFormControl extends FormControlInfo {
  controlType = 'script';
  style = { 'width': '500px' };

  constructor(options: ControlOptions = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class BooleanJettiFormControl extends FormControlInfo {
  controlType = 'boolean';
  type = 'boolean';
  style = { 'max-width': '45px', 'min-width': '24px', 'width' : '90px', 'text-align' : 'center'};

  constructor(options: ControlOptions = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class DateJettiFormControl extends FormControlInfo {
  controlType = 'date';
  type = 'date';
  style = { 'max-width' : '110px', 'width' : '110px'};

  constructor(options: ControlOptions = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class DateTimeJettiFormControl extends FormControlInfo {
  controlType = 'datetime';
  type = 'datetime';
  style = { 'max-width' : '135px', 'width' : '145px' };

  constructor(options: ControlOptions = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export interface JettiComplexObject {
  id: string; value: string; code: string; type: string; data?: any;
}

export class AutocompleteJettiFormControl extends FormControlInfo {
  controlType = 'autocomplete';
  style = { 'width' : '250px' };
  value: JettiComplexObject = { id: null, code: null, type: this.type, value: null };

  constructor(options: ControlOptions = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class NumberJettiFormControl extends FormControlInfo {
  controlType = 'number';
  type = 'number';
  style = { 'width': '100px', 'text-align' : 'right' };

  constructor(options: ControlOptions = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class TableDynamicControl extends FormControlInfo {
  controlType = 'table';
  type = 'table';
  controls: FormControlInfo[] = [];

  constructor(options: ControlOptions = {}) {
    super(options);
  }
}

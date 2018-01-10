import { FormControl } from '@angular/forms/src/model';

import { PatchValue } from './../../../../server/models/api';


export interface ControlOptions<T> {
  value?: T;
  type?: string;
  key?: string;
  label?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  order?: number;
  controlType?: string;
  style?: any;
  owner?: string;
  totals?: number;
  onChange?: (doc, value) => Promise<PatchValue>;
  onChangeServer?: boolean;
}

export class BaseJettiFormControl<T> {
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
  owner?: string;
  totals: number;
  showLabel = true;
  onChange?: (doc, value) => Promise<PatchValue>;
  onChangeServer?: boolean;

  constructor(options: ControlOptions<T> = {}) {
    this.value = options.value;
    this.type = options.type;
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.readOnly = !!options.readOnly;
    this.hidden = !!options.hidden;
    this.order = options.order === undefined ? 9999999 : options.order;
    this.controlType = options.controlType;
    this.style = options.style || { 'width': '150px'};
    this.totals = options.totals || null;
    this.owner = options.owner;
    this.onChange = options.onChange;
    this.onChangeServer = options.onChangeServer;
  }
}

export class TextboxJettiFormControl extends BaseJettiFormControl<string> {
  controlType = 'string';
  type = 'string';

  constructor(options: ControlOptions<string> = {}) {
    super(options);
  }
}

export class TextareaJettiFormControl extends BaseJettiFormControl<string> {
  controlType = 'textarea';
  type = 'string';

  constructor(options: ControlOptions<string> = {}) {
    super(options);
  }
}

export class ScriptJettiFormControl extends BaseJettiFormControl<string> {
  controlType = 'script';
  style = { 'width': '500px' };

  constructor(options: ControlOptions<string> = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class BooleanJettiFormControl extends BaseJettiFormControl<boolean> {
  controlType = 'boolean';
  type = 'boolean';
  style = { 'max-width': '45px', 'min-width': '24px', 'width' : '90px', 'text-align' : 'center'};

  constructor(options: ControlOptions<boolean> = {}) {
    super(options);
    if (typeof this.value !== 'boolean') { this.value = false; }
    if (options.style) { this.style = options.style; }
  }
}

export class DateJettiFormControl extends BaseJettiFormControl<Date> {
  controlType = 'date';
  type = 'date';
  style = { 'max-width' : '110px', 'width' : '110px'};

  constructor(options: ControlOptions<Date> = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class DateTimeJettiFormControl extends BaseJettiFormControl<Date> {
  controlType = 'datetime';
  type = 'datetime';
  style = { 'max-width' : '135px', 'width' : '145px' };

  constructor(options: ControlOptions<Date> = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export interface JettiComplexObject {
  id: string; value: string; code: string; type: string; data?: any;
}

export class AutocompleteJettiFormControl extends BaseJettiFormControl<JettiComplexObject> {
  controlType = 'autocomplete';
  style = { 'width' : '250px' };

  constructor(options: ControlOptions<JettiComplexObject> = {}) {
    super(options);
    if (!this.value) {
      this.value = {id: '',  code: '', type: this.type, value: null};
    }
    if (options.style) { this.style = options.style; }
  }
}

export class NumberJettiFormControl extends BaseJettiFormControl<number> {
  controlType = 'number';
  type = 'number';
  style = { 'width': '100px', 'text-align' : 'right' };

  constructor(options: ControlOptions<number> = {}) {
    super(options);
    if (options.style) { this.style = options.style; }
  }
}

export class TableDynamicControl extends BaseJettiFormControl<Object> {
  controlType = 'table';
  type = 'table';

  constructor(options: ControlOptions<Object> = {}) {
    super(options);
  }
}

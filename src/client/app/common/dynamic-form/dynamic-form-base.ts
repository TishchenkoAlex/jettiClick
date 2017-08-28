export interface ControlOptions<T> {
  value?: T,
  type?: string,
  key?: string,
  label?: string,
  required?: boolean,
  readOnly?: boolean,
  hidden?: boolean,
  order?: number,
  controlType?: string
}

export class BaseDynamicControl<T> {
  value: T;
  type: string;
  key: string;
  label: string;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  order: number;
  controlType: string;

  constructor(options: ControlOptions<T> = {}) {
    this.value = options.value;
    this.type = options.type || '';
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.readOnly = !!options.readOnly;
    this.hidden = !!options.hidden;
    this.order = options.order === undefined ? 999 : options.order;
    this.controlType = options.controlType || '';
  }
}

export class TextboxDynamicControl extends BaseDynamicControl<string> {
  controlType = 'textbox';
  type = 'string';

  constructor(options: ControlOptions<string> = {}) {
    super(options);
  }
}

export class BooleanDynamicControl extends BaseDynamicControl<boolean> {
  controlType = 'checkbox';
  type = 'boolean';

  constructor(options: ControlOptions<boolean> = {}) {
    super(options);
    if (typeof this.value !== 'boolean') { this.value = false; }
  }
}

export class DateDynamicControl extends BaseDynamicControl<Date> {
  controlType = 'date';
  type = 'date';

  constructor(options: ControlOptions<Date> = {}) {
    super(options);
    this.value = new Date(options['value']);
  }
}

export class DateTimeDynamicControl extends BaseDynamicControl<Date> {
  controlType = 'datetime';
  type = 'date';

  constructor(options: ControlOptions<Date> = {}) {
    super(options);
    this.value = new Date(options['value']);
  }
}

export interface ComplexObject {
  id: string, code: string, desciption: string, type: string
}

export class DropdownDynamicControl extends BaseDynamicControl<ComplexObject> {
  controlType = 'autocomplete';

  constructor(options: ControlOptions<ComplexObject> = {}) {
    super(options);
    this.type = options['type'] || '';
  }
}

export class NumberDynamicControl extends BaseDynamicControl<number> {
  controlType = 'number';
  type = 'number';

  constructor(options: ControlOptions<number> = {}) {
    super(options);
  }
}

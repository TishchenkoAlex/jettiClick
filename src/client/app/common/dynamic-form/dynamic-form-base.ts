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

  constructor(options: {
    value?: T,
    type?: string,
    key?: string,
    label?: string,
    required?: boolean,
    readOnly?: boolean,
    hidden?: boolean,
    order?: number,
    controlType?: string
  } = {}) {
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

  constructor(options: {} = {}) {
    super(options);
  }
}

export class BooleanDynamicControl extends BaseDynamicControl<boolean> {
  controlType = 'boolean';

  constructor(options: {} = {}) {
    super(options);
    if (typeof this.value !== 'boolean') { this.value = false; }
  }
}

export class DateDynamicControl extends BaseDynamicControl<Date> {
  controlType = 'date';

  constructor(options: {} = {}) {
    super(options);
    this.type = options['type'] || 'date';
    this.value = new Date(options['value']);
  }
}

export class DropdownDynamicControl extends BaseDynamicControl<string> {
  controlType = 'autocomplete';

  constructor(options: {} = {}) {
    super(options);
    this.type = options['type'] || '';
  }
}

export class NumberDynamicControl extends BaseDynamicControl<Date> {
  controlType = 'number';
  type = 'number';

  constructor(options: {} = {}) {
    super(options);
  }
}

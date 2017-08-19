export class BaseDynamicControl<T> {
    value: T;
    type: string;
    key: string;
    label: string;
    required: boolean;
    readOnly: boolean;
    order: number;
    controlType: string;

    constructor(options: {
        value?: T,
        type?: string,
        key?: string,
        label?: string,
        required?: boolean,
        readOnly?: boolean,
        order?: number,
        controlType?: string
    } = {}) {
        this.value = options.value;
        this.type = options.type || '';
        this.key = options.key || '';
        this.label = options.label || '';
        this.required = !!options.required;
        this.readOnly = !!options.readOnly;
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';
    }
}

import { BaseDynamicControl } from './dynamic-form-base';

export class NumberDynamicControl extends BaseDynamicControl<Date> {
    controlType = 'number';
    type = 'number';

    constructor(options: {} = {}) {
        super(options);
    }
}

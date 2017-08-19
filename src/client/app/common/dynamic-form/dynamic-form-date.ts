import { BaseDynamicControl } from './dynamic-form-base';

export class DateDynamicControl extends BaseDynamicControl<Date> {
    controlType = 'date';
    type: '';

    constructor(options: {} = {}) {
        super(options);
        this.type = options['type'] || '';
    }
}

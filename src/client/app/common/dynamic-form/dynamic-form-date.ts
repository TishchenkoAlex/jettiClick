import { BaseDynamicControl } from './dynamic-form-base';

export class DateDynamicControl extends BaseDynamicControl<Date> {
    controlType = 'date';

    constructor(options: {} = {}) {
        super(options);
        this.type = options['type'] || 'date';
        this.value =  new Date(options['value']);
    }
}

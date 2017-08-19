import { BaseDynamicControl } from './dynamic-form-base';

export class BooleanDynamicControl extends BaseDynamicControl<boolean> {
    controlType = 'boolean';
    type: '';

    constructor(options: {} = {}) {
        super(options);
        this.type = options['type'] || '';
    }
}

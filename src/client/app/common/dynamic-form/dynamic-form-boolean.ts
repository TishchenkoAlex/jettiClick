import { BaseDynamicControl } from './dynamic-form-base';

export class BooleanDynamicControl extends BaseDynamicControl<boolean> {
    controlType = 'boolean';

    constructor(options: {} = {}) {
        super(options);
        if (typeof this.value !== 'boolean') { this.value = false; }
    }
}

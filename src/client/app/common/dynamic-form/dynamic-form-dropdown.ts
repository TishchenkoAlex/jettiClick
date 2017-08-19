import { BaseDynamicControl } from './dynamic-form-base';

export class DropdownDynamicControl extends BaseDynamicControl<string> {
    controlType = 'autocomplete';
    type = '';

    constructor(options: {} = {}) {
        super(options);
        this.type = options['type'] || '';
    }
}

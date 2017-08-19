import { BaseDynamicControl } from './dynamic-form-base';

export class TextboxDynamicControl extends BaseDynamicControl<string> {
    controlType = 'textbox';
    type: string;

    constructor(options: {} = {}) {
        super(options);
        this.type = options['type'] || '';
    }
}

import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { BaseDynamicControl } from './dynamic-form-base';

@Injectable()
export class DynamicFormControlService {

    toFormGroup(controls: BaseDynamicControl<any>[]) {
        const group: any = {};

        controls.forEach(control => {
            group[control.key] = control.required ?
                new FormControl(control.value, Validators.required) : new FormControl(control.value);
        });
        return new FormGroup(group);
    }
}

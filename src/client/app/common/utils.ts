import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { BaseJettiFromControl, TableDynamicControl } from './dynamic-form/dynamic-form-base';

export function copyFormGroup(formGroup: FormGroup): FormGroup {
    const newFormGroup = new FormGroup({});
    Object.keys(formGroup.controls).forEach(key => {
        const sourceFormControl = formGroup.controls[key];
        const newFormControl = sourceFormControl.validator ?
            new FormControl(sourceFormControl.value, Validators.required) :
            new FormControl(sourceFormControl.value);
        newFormGroup.addControl(key, newFormControl);
    });
    return newFormGroup;
}

export function toFormGroup(controls: BaseJettiFromControl<any>[]) {
    const group: any = {};

    controls.forEach(control => {
        if (control instanceof TableDynamicControl) {
            const Row = {};
            const arr: FormGroup[] = [];
            (control.value as BaseJettiFromControl<any>[]).forEach(item => {
                Row[item.key] = item.required ?
                    new FormControl(item.value, Validators.required) : new FormControl(item.value);
            });
            arr.push(new FormGroup(Row));
            group[control.key] = control.required ?
                new FormArray(arr, Validators.required) : new FormArray(arr);
        } else {
            group[control.key] = control.required ?
                new FormControl(control.value, Validators.required) : new FormControl(control.value);
        }
    });
    const result = new FormGroup(group);
    return result;
}

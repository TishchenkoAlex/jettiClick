import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { FormTypes } from '../../../../server/models/Forms/form.types';
import { ApiService } from '../../services/api.service';
import { cloneFormGroup } from '../utils';
import { DocumentBase } from './../../../../server/models/document';
import { createDocument } from './../../../../server/models/documents.factory';
import { createForm } from './../../../../server/models/Forms/form.factory';
import {
    AutocompleteJettiFormControl,
    BaseJettiFormControl,
    BooleanJettiFormControl,
    ControlOptions,
    DateJettiFormControl,
    DateTimeJettiFormControl,
    NumberJettiFormControl,
    ScriptJettiFormControl,
    TableDynamicControl,
    TextareaJettiFormControl,
    TextboxJettiFormControl,
} from './dynamic-form-base';

export interface ViewModel {
  view: BaseJettiFormControl<any>[];
  model: DocumentBase;
  formGroup: FormGroup;
  controlsByKey: { [s: string]: BaseJettiFormControl<any> };
}

function toFormGroup(controls: BaseJettiFormControl<any>[]) {
  const group: any = {};

  controls.forEach(control => {
    if (control instanceof TableDynamicControl) {
      const Row = {};
      const arr: FormGroup[] = [];
      (control.value as BaseJettiFormControl<any>[]).forEach(item => {
        Row[item.key] = item.required ? new FormControl(item.value, Validators.required) : new FormControl(item.value);
      });
      arr.push(new FormGroup(Row));
      group[control.key] = control.required ? new FormArray(arr, Validators.required) : new FormArray(arr);
    } else {
      group[control.key] = control.required ? new FormControl(control.value, Validators.required) : new FormControl(control.value);
    }
  });
  const result = new FormGroup(group);
  return result;
}

export const patchOptionsNoEvents = { onlySelf: false, emitEvent: false, emitModelToViewChange: false, emitViewToModelChange: false };

export function getViewModel(view, model, isExists: boolean) {
  let fields: BaseJettiFormControl<any>[] = [];

  const processRecursive = (v, f: BaseJettiFormControl<any>[]) => {
    Object.keys(v).map(key => {
      const prop = v[key];
      const hidden = !!prop['hidden'];
      const order = hidden ? -1 : prop['order'] * 1 || 999;
      const label = prop['label'] || key.toString();
      const type = prop['type'] || 'string';
      const controlType = prop['controlType'] || prop['type'] || 'string';
      const required = !!prop['required'];
      const readOnly = !!prop['readOnly'];
      const style = prop['style'];
      const totals = prop['totals'] * 1 || null;
      const change = prop['change'];
      const owner = prop['owner'] || '';
      const onChange = prop['onChange'];
      const onChangeServer = !!prop['onChangeServer'];
      let newControl: BaseJettiFormControl<any>;
      const controlOptions: ControlOptions<any> = {
        key: key, label: label, type: controlType, required: required, readOnly: readOnly, hidden: hidden,
        order: order, style: style, onChange: onChange, owner: owner, totals: totals, onChangeServer: onChangeServer
      };
      switch (controlType) {
        case 'table':
          const value = [];
          processRecursive(v[key][key] || {}, value);
          controlOptions.value = value;
          newControl = new TableDynamicControl(controlOptions);
          break;
        case 'boolean':
          newControl = new BooleanJettiFormControl(controlOptions);
          break;
        case 'date':
          newControl = new DateJettiFormControl(controlOptions);
          break;
        case 'datetime':
          newControl = new DateTimeJettiFormControl(controlOptions);
          break;
        case 'number':
          newControl = new NumberJettiFormControl(controlOptions);
          break;
        case 'javascript': case 'json':
          newControl = new ScriptJettiFormControl(controlOptions);
          break;
        case 'textarea':
          newControl = new TextareaJettiFormControl(controlOptions);
          break;
        default:
          if (type.includes('.')) {
            controlOptions.type = controlType; // здесь нужен тип ссылки
            newControl = new AutocompleteJettiFormControl(controlOptions);
            break;
          }
          newControl = new TextboxJettiFormControl(controlOptions);
          break;
      }
      f.push(newControl);
    });
    f.sort((a, b) => a.order - b.order);
  };

  processRecursive(view, fields);

  const formGroup = toFormGroup(fields);

  // Create formArray's for table parts of document
  Object.keys(formGroup.controls)
    .filter(property => formGroup.controls[property] instanceof FormArray)
    .forEach(property => {
      const sample = (formGroup.controls[property] as FormArray).controls[0] as FormGroup;
      sample.addControl('index', new FormControl(0));
      const formArray = formGroup.controls[property] as FormArray;
      if (isExists) {
        if (!model[property]) { model[property] = []; }
        for (let i = 1; i <= model[property].length; i++) {
          const newFormGroup = cloneFormGroup(sample);
          newFormGroup.controls['index'].setValue(i, patchOptionsNoEvents);
          formArray.push(newFormGroup);
        }
      }
    });
  const controlsByKey: { [s: string]: BaseJettiFormControl<any> } = {};
  fields.forEach(c => { controlsByKey[c.key] = c; });
  fields = [
    ...fields.filter(el => el.order > 0 && el.type !== 'table'),
    ...fields.filter(el => el.order > 0 && el.type === 'table'),
    ...fields.filter(el => el.order <= 0)
  ];
  formGroup.patchValue(model, patchOptionsNoEvents);
  return { view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey};
}


@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService) { }

  getViewModel$(docType: string, docID = ''): Observable<ViewModel> {
    const doc = createDocument(docType as any);
    const view = doc.Props();
    return this.apiService.getViewModel(docType, docID).pipe(
      map(viewModel => getViewModel(view, viewModel['model'], docID !== 'new')));
  }

  getView$(type: string) {
    return this.apiService.getView(type);
  }

  getFormView$(type: FormTypes) {
    const form = createForm(type);
    const view = form.Props();
    return getViewModel(view, {}, false);
  }

}

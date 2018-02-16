import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { DocumentBase } from '../../../../server/models/document';
import { createDocument } from '../../../../server/models/documents.factory';
import { DocTypes } from '../../../../server/models/documents.types';
import { createForm } from '../../../../server/models/Forms/form.factory';
import { FormTypes } from '../../../../server/models/Forms/form.types';
import { ApiService } from '../../services/api.service';
import { cloneFormGroup } from '../utils';
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
  view: BaseJettiFormControl[];
  model: DocumentBase;
  formGroup: FormGroup;
  controlsByKey: { [s: string]: BaseJettiFormControl };
  schema: { [s: string]: any };
}

function toFormGroup(controls: BaseJettiFormControl[]) {
  const group: any = {};

  controls.forEach(control => {
    if (control instanceof TableDynamicControl) {
      const Row = {};
      const arr: FormGroup[] = [];
      for (const item of control.controls) {
        Row[item.key] = item.required ? new FormControl(item.value, Validators.required) : new FormControl(item.value);
      }
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

export function getViewModel(view, model, isExists: boolean): ViewModel {
  let fields: BaseJettiFormControl[] = [];

  const processRecursive = (v, f: BaseJettiFormControl[]) => {
    Object.keys(v).map(key => {
      const prop = v[key];
      const hidden = !!prop['hidden'];
      const order = hidden ? -1 : prop['order'] * 1 || 999;
      const label: string = prop['label'] || key.toString();
      const type: string = prop['type'] || 'string';
      const controlType: string = prop['controlType'] || prop['type'] || 'string';
      const required = !!prop['required'];
      const readOnly = !!prop['readOnly'];
      const style = prop['style'];
      const totals = prop['totals'] * 1 || null;
      const change = prop['change'];
      const owner: string = prop['owner'] || null;
      const onChange = prop['onChange'];
      const onChangeServer = !!prop['onChangeServer'];
      let newControl: BaseJettiFormControl;
      const controlOptions: ControlOptions = {
        key, label, type: controlType, required, readOnly, hidden, change, order, style, onChange, owner, totals, onChangeServer
      };
      switch (controlType) {
        case 'table':
          const value: BaseJettiFormControl[] = [];
          processRecursive(v[key][key] || {}, value);
          newControl = new TableDynamicControl(controlOptions);
          (newControl as TableDynamicControl).controls = value;
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
  const controlsByKey: { [s: string]: BaseJettiFormControl } = {};
  fields.forEach(c => { controlsByKey[c.key] = c; });
  fields = [
    ...fields.filter(el => el.order > 0 && el.type !== 'table'),
    ...fields.filter(el => el.order > 0 && el.type === 'table'),
    ...fields.filter(el => el.order <= 0)
  ];
  fields.forEach(el => { if (el.key === 'p1' || el.key === 'p2') { el.hidden = true; }});
  formGroup.patchValue(model, patchOptionsNoEvents);
  return <ViewModel>{ view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey, schema: view };
}


@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService) { }

  getViewModel$(docType: DocTypes, docID = '', operationID = ''): Observable<ViewModel> {
    return this.apiService.getViewModel(docType, docID, operationID).pipe(
      map(viewModel => {
        return getViewModel({ ...viewModel.view, ...createDocument(docType).Props() }, viewModel.model, docID !== 'new');
      }));
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

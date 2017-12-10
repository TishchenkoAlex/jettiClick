import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { IServerDocument } from '../../../../server/models/ServerDocument';
import { ApiService } from '../../services/api.service';
import { cloneFormGroup } from '../utils';
import {
    AutocompleteJettiFormControl,
    BaseJettiFromControl,
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
import { DocumentBase } from './../../../../server/models/document';

export interface ViewModel {
  view: BaseJettiFromControl<any>[];
  model: DocumentBase,
  formGroup: FormGroup,
  controlsByKey: { [s: string]: BaseJettiFromControl<any> }
}

function toFormGroup(controls: BaseJettiFromControl<any>[]) {
  const group: any = {};

  controls.forEach(control => {
    if (control instanceof TableDynamicControl) {
      const Row = {};
      const arr: FormGroup[] = [];
      (control.value as BaseJettiFromControl<any>[]).forEach(item => {
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

export function getViewModel(view, model, exclude: string[], isExists: boolean) {
  let fields: BaseJettiFromControl<any>[] = [];

  const processRecursive = (v, f: BaseJettiFromControl<any>[], excl: string[]) => {
    Object.keys(v).filter(key => excl.indexOf(key) === -1).map(key => {
      const prop = v[key];
      const hidden = !!prop['hidden'];
      const order = hidden ? -1 : prop['order'] * 1 || 999;
      const label = prop['label'] || key.toString();
      const dataType = prop['controlType'] || prop['type'] || 'string';
      const required = !!prop['required'];
      const readOnly = !!prop['readOnly'];
      const style = prop['style'];
      const totals = prop['totals'] * 1 || null;
      const change = prop['change'];
      const owner = prop['owner'] || '';
      let newControl: BaseJettiFromControl<any>;
      const controlOptions: ControlOptions<any> = {
        key: key, label: label, type: dataType, required: required, readOnly: readOnly,
        order: order, hidden: hidden, style: style, change: change, owner: owner, totals: totals,
      };
      switch (dataType) {
        case 'table':
          const value = [];
          processRecursive(v[key][key] || {}, value, []);
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
          if (dataType.includes('.')) {
            controlOptions.type = dataType; // здесь нужен тип ссылки
            newControl = new AutocompleteJettiFormControl(controlOptions);
            break;
          };
          newControl = new TextboxJettiFormControl(controlOptions);
          break;
      }
      f.push(newControl);
    });
    f.forEach(e => {
      if (e.key === 'parent' || e.order <= 0 || e.hidden) {
        e.order = -1;
      }
      if (e instanceof TableDynamicControl) { e.order = e.order + 101 }
    });
    f.sort((a, b) => a.order - b.order);
    f = [...f.filter(el => el.order > 0), ...f.filter(el => el.order <= 0)];
    let i = 1; f.filter(e => e.order > 0).forEach(el => el.order = i++);
  };

  processRecursive(view, fields, exclude);

  const formGroup = toFormGroup(fields);

  // Create formArray's for table parts of document
  Object.keys(formGroup.controls)
    .filter(property => formGroup.controls[property] instanceof FormArray)
    .forEach(property => {
      const sample = (formGroup.controls[property] as FormArray).controls[0] as FormGroup;
      sample.addControl('index', new FormControl(0));
      const formArray = formGroup.controls[property] as FormArray;
      if (isExists) {
        if (!model[property]) { model[property] = [] }
        for (let i = 1; i <= model[property].length; i++) {
          const newFormGroup = cloneFormGroup(sample);
          newFormGroup.controls['index'].setValue(i, patchOptionsNoEvents);
          formArray.push(newFormGroup);
        }
      }
    });
  const controlsByKey: { [s: string]: BaseJettiFromControl<any> } = {};
  fields.forEach(c => { controlsByKey[c.key] = c });
  fields = [...fields.filter(el => el.order > 0), ...fields.filter(el => el.order <= 0)];
  formGroup.patchValue(model, patchOptionsNoEvents);
  return { view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey}
}

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService) { };

  getViewModel$(docType: string, docID = ''): Observable<ViewModel> {
    const exclude = ['posted', 'deleted', 'isfolder'];
    switch (docType.split('.')[0]) {
      case 'Catalog': { exclude.push('date', 'company'); break; }
      case 'Document':
      case 'Journal': { exclude.push('description'); break; }
    }
    return this.apiService.getViewModel(docType, docID).pipe(
      map(viewModel => {
        const view = viewModel['view'];
        const model: IServerDocument = viewModel['model'];
        const commands = viewModel['commands'];
        return getViewModel(view, model, exclude, docID !== 'new')
      }));
  }

  getView$(type: string) {
    return this.apiService.getView(type);
  }

}

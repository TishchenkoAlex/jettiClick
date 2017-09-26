import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocModel } from '../doc.model';
import { copyFormGroup, toFormGroup } from '../utils';
import {
    AutocompleteJettiFormControl,
    BaseJettiFromControl,
    BooleanJettiFormControl,
    ControlOptions,
    DateJettiFormControl,
    NumberJettiFormControl,
    ScriptJettiFormControl,
    TableDynamicControl,
    TextareaJettiFormControl,
    TextboxJettiFormControl,
} from './dynamic-form-base';

export interface ViewModel {
  view: BaseJettiFromControl<any>[];
  model: DocModel,
  formGroup: FormGroup,
  controlsByKey: { [s: string]: BaseJettiFromControl<any> },
  schema: any;
}

export const patchOptionsNoEvents = { onlySelf: true, emitEvent: false, emitModelToViewChange: false, emitViewToModelChange: false };

export function getViewModel(view, model, exclude: string[], isExists: boolean) {
  const fields: BaseJettiFromControl<any>[] = [];

  const processRecursive = (v, f: BaseJettiFromControl<any>[], excl: string[]) => {
    Object.keys(v).filter(key => excl.indexOf(key) === -1 && !!!v[key]['hidden']).map(key => {
      const prop = v[key];
      const hidden = !!prop['hidden'];
      const order = hidden ? 1000 : prop['order'] * 1 || 999;
      const label = prop['label'] || key.toString();
      const dataType = prop['type'] || 'string';
      const required = prop['required'] || false;
      const readOnly = prop['readOnly'] || false;
      const style = prop['style'] || false;
      const change = prop['change'];
      let newControl: BaseJettiFromControl<any>;
      const controlOptions: ControlOptions<any> = {
        key: key, label: label, type: dataType, required: required, readOnly: readOnly,
        order: order, hidden: hidden, style: style, change: change,
      };
      switch (dataType) {
        case 'table':
          const value = [];
          processRecursive(v[key][key], value, []);
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
          newControl = new DateJettiFormControl(controlOptions);
          break;
        case 'number':
          newControl = new NumberJettiFormControl(controlOptions);
          break;
        case 'javascript':
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
    let i = -100; f.sort((a, b) => a.order - b.order).filter(e => !(e instanceof TableDynamicControl)).forEach(e => e.order = i++);
    i = 1; f.sort((a, b) => a.order - b.order).forEach(e => e.order = i++);
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
          const newFormGroup = copyFormGroup(sample);
          newFormGroup.controls['index'].setValue(i, patchOptionsNoEvents);
          formArray.push(newFormGroup);
        }
      }
    });
  const controlsByKey: { [s: string]: BaseJettiFromControl<any> } = {};
  fields.forEach(c => { controlsByKey[c.key] = c });
  formGroup.patchValue(model, patchOptionsNoEvents);
  return { view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey, schema: view }
}

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService) { };

  getViewModel$(docType: string, docID = ''): Observable<ViewModel> {
    const exclude = ['id', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'user'];
    switch (docType.split('.')[0]) {
      case 'Catalog': { exclude.push('date', 'company'); break; }
      case 'Document':
      case 'Journal': { exclude.push('description'); break; }
    }
    return this.apiService.getViewModel(docType, docID)
      .map(viewModel => {
        const model = viewModel['model'];
        const view = viewModel['view'];
        return getViewModel(view, model, exclude, docID !== 'new')
      });
  }

  getView$(type: string): Observable<Object> {
    return this.apiService.getView(type);
  }

}

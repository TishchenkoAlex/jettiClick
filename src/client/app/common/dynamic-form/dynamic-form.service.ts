import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocModel } from '../doc.model';
import {
    AutocompleteJettiFormControl,
    BaseJettiFromControl,
    BooleanJettiFormControl,
    ControlOptions,
    DateJettiFormControl,
    NumberJettiFormControl,
    TableDynamicControl,
    TextboxJettiFormControl,
} from './dynamic-form-base';
import { DynamicFormControlService } from './dynamic-form-control.service';

export interface ViewModel {
  view: BaseJettiFromControl<any>[];
  model: DocModel,
  formGroup: FormGroup,
  controlsByKey: {[s: string]: BaseJettiFromControl<any>} ,
  tableParts: any;
}
export const patchOptionsNoEvents = { onlySelf: true, emitEvent: false, emitModelToViewChange: false, emitViewToModelChange: false };

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService, private fc: DynamicFormControlService) { };

  copyFormGroup(formGroup: FormGroup): FormGroup {
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

  getViewModel(docType: string, docID = ''): Observable<ViewModel> {
    const fields: BaseJettiFromControl<any>[] = [];

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

        const processRecursive = (v, f: BaseJettiFromControl<any>[]) => {
          Object.keys(v).filter(key => exclude.indexOf(key) === -1).map(key => {
            const prop = v[key];
            const hidden = !!prop['hidden'];
            const order = hidden ? 1000 : prop['order'] * 1 || 999;
            const label = prop['label'] || key.toString();
            const dataType = prop['type'] || 'string';
            const required = prop['required'] || false;
            const readOnly = prop['readOnly'] || false;
            const style = prop['style'] || false;
            const change = prop['change'];
            if (dataType === 'boolean') { model[key] = !!model[key]; }
            let newControl: BaseJettiFromControl<any>;
            const controlOptions: ControlOptions<any> = {
              key: key, label: label, type: dataType, required: required, readOnly: readOnly,
              order: order, hidden: hidden, style: style, change: change,
            };
            switch (dataType) {
              case 'table':
                const value = [];
                processRecursive(v[key][key], value);
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

        processRecursive(view, fields);

        const controlsByKey: {[s: string]: BaseJettiFromControl<any>} = {};
        fields.map(c => { controlsByKey[c.key] = c });
        const formGroup = this.fc.toFormGroup(fields);
        const tableParts = [];
        // Create formArray's for table parts of document
        Object.keys(formGroup.controls)
          .filter(property => formGroup.controls[property] instanceof FormArray)
          .forEach(property => {
            const sample = (formGroup.controls[property] as FormArray).controls[0] as FormGroup;
            sample.addControl('index', new FormControl(0));
            const indexOfTable = fields.findIndex(i => i.key === property);
            const formArray = formGroup.controls[property] as FormArray;
            tableParts.push({ id: indexOfTable, value: fields[indexOfTable].label, sampleRow: sample });
            if (docID !== 'new') {
              for (let i = 0; i < model[property].length; i++) {
                const newFormGroup = this.copyFormGroup(sample);
                newFormGroup.controls['index'].setValue(i, patchOptionsNoEvents);
                formArray.push(newFormGroup);
              }
            }
            formArray.removeAt(0);  // delete sample row
          });

        formGroup.patchValue(model, patchOptionsNoEvents);
        return { view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey, tableParts: tableParts }
      });
  }
}

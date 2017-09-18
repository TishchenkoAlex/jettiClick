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
  controlsByKey: any,
  tableParts: any;
}
export const patchOptions = { onlySelf: true, emitEvent: false, emitModelToViewChange: false, emitViewToModelChange: false };

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService, private fc: DynamicFormControlService) { };

  copyFormGroup(formGroup: FormGroup): FormGroup {
    const newFormGroup = new FormGroup({});
    Object.keys(formGroup.controls).forEach(key => {
      const newFormControl = formGroup.controls[key].validator ?
        new FormControl(formGroup.controls[key].value, Validators.required) :
        new FormControl(formGroup.controls[key].value);
      newFormGroup.addControl(key, newFormControl);
    });
    return newFormGroup;
  }


  getViewModel(docType: string, docID = ''): Observable<ViewModel> {

    const fields: BaseJettiFromControl<any>[] = [];
    const exclude = ['id', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'user'];

    if (docType.startsWith('Catalog.')) { exclude.push('date', 'company'); }
    if (docType.startsWith('Document.')) { exclude.push('description'); }

    return this.apiService.getViewModel(docType, docID)
      .map(viewModel => {
        const model = viewModel['model'];
        const view = viewModel['view'];

        const processRecursive = (v, f: BaseJettiFromControl<any>[]) => {
          Object.keys(v).map((property) => {
            if (exclude.indexOf(property) > -1) { return; }
            const prop = v[property];
            const order = prop['order'] * 1 || 99;
            const hidden = prop['hidden'] === 'true';
            const label = prop['label'] || property.toString();
            const dataType = prop['type'] || 'string';
            const required = prop['required'] || false;
            const readOnly = prop['readOnly'] || false;
            const style = prop['style'] || false;
            const change = prop['change'];
            if (dataType === 'boolean') { model[property] = !!model[property]; }
            let newControl: BaseJettiFromControl<any>;
            const controlOptions: ControlOptions<any> = {
              key: property, label: label, type: dataType, required: required, readOnly: readOnly,
              order: order, hidden: hidden, style: style, change: change,
            };
            switch (dataType) {
              case 'table':
                const value = [];
                processRecursive(v[property][property], value);
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
          f.sort((a, b) => a.order - b.order);
        };

        processRecursive(view, fields);

        const controlsByKey: any = {};
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
            fields[indexOfTable].value.sort((a, b) => a.order - b.order);
            const formArray = formGroup.controls[property] as FormArray;
            tableParts.push({ id: indexOfTable, value: fields[indexOfTable].label, sampleRow: sample });
            if (docID !== 'new') {
              for (let i = 0; i < model[property].length; i++) {
                const newFormGroup = this.copyFormGroup(sample);
                newFormGroup.controls['index'].setValue(i);
                formArray.push(newFormGroup);
              }
            }
            formArray.removeAt(0);  // delete sample row
          });

        formGroup.patchValue(model, patchOptions);
        return { view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey, tableParts: tableParts }
      });
  }
}

import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
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

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService, private fc: DynamicFormControlService) { };

  getViewModel(docType: string, docID = ''): Observable<ViewModel> {

    const fields: BaseJettiFromControl<any>[] = [];
    const exclude = ['id', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'user'];

    if (docType.startsWith('Catalog.')) { exclude.push('date', 'company'); }
    if (docType.startsWith('Document.')) { exclude.push('description'); }

    return this.apiService.getViewModel(docType, docID)
      .map(viewModel => {
        const model = viewModel['model'];
        const view = viewModel['view'];

        const processRecursive = (v, f) => {
          Object.keys(v).map((property) => {
            if (exclude.indexOf(property) > -1) { return; }
            if (v[property].constructor === Array) {
              const value = [];
              processRecursive(v[property][0], value);
              f.push(new TableDynamicControl({ key: property, label: property, value: value }));
              return;
            };
            const prop = v[property];
            const order = prop['order'] * 1 || 99;
            const hidden = prop['hidden'] === 'true';
            const label = prop['label'] || property.toString();
            const dataType = prop['type'] || 'string';
            const required = prop['required'] || false;
            const readOnly = prop['readOnly'] || false;
            const style = prop['style'] || false;
            if (dataType === 'boolean') { model[property] = !!model[property]; }
            let newControl: BaseJettiFromControl<any>;
            const controlOptions: ControlOptions<any> = {
              key: property,
              label: label, type: dataType, required: required, readOnly: readOnly, order: order, hidden: hidden, style: style
            };
            switch (dataType) {
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
        };

        processRecursive(view, fields);
        fields.sort((a, b) => a.order - b.order);
        const controlsByKey: any = {};
        fields.map(c => { controlsByKey[c.key] = c });
        const formGroup = this.fc.toFormGroup(fields);
        const tableParts = [];
        // Create formArray's for table parts of document
        Object.keys(view).forEach(property => { // multiply "sample" row by count of model array rows
          const sample = view[property][0]; // sample row will be deleted in code below
          if ((view[property].constructor === Array)
            && (model[property] && model[property].constructor === Array)) {
            const indexOfTable = fields.findIndex(i => i.key === property);
            fields[indexOfTable].value.sort((a, b) => a.order - b.order);
            const formArray = formGroup.controls[property] as FormArray;
            model[property].forEach(element => {
              const Row = {}; const arr: FormGroup[] = [];
              Object.keys(sample).forEach(item => Row[item] = new FormControl(null));
              formArray.push(new FormGroup(Row));
            });
            tableParts.push({id: indexOfTable, value: property, sampleRow: formArray.controls[0]});
            if (docID === 'new') { formArray.controls = [];
            } else { formArray.removeAt(0); } // delete sample row
          }
        });

        formGroup.patchValue(model);
        return { view: fields, model: model, formGroup: formGroup, controlsByKey: controlsByKey, tableParts: tableParts }
      });
  }
}

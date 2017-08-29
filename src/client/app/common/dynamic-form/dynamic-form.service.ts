import { FormGroup } from '@angular/forms';
import { DynamicFormControlService } from './dynamic-form-control.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocModel } from '../_doc.model';

import {
  BaseDynamicControl, BooleanDynamicControl, DateDynamicControl,
  NumberDynamicControl, DropdownDynamicControl, TextboxDynamicControl, ControlOptions
} from './dynamic-form-base';

export interface ViewModel {
  view: BaseDynamicControl<any>[];
  model: DocModel,
  formGroup: FormGroup,
  controlsByKey: any
}

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService, private fc: DynamicFormControlService) { };

  getControls(docType: string, docID = ''): Observable<ViewModel> {

    const fields: BaseDynamicControl<any>[] = [];
    const exclude = ['id', 'type', 'posted', 'deleted', 'isfolder', 'parent'];

    if (docType.startsWith('Catalog.')) { exclude.push('date'); }
    if (docType.startsWith('Document.')) { exclude.push('description'); }

    return this.apiService.getViewModel(docType, docID)
      .map(viewModel => {
        const model = viewModel['model'];
        model.date = new Date(model.date);
        const view = viewModel['view'];

        const process = (v, f) => {
          Object.keys(v).map((property) => {
            if (exclude.indexOf(property) > -1) { return; }
            if (v[property].constructor === Array) {
             return;
            };
            const prop = v[property];
            const order = prop['order'] * 1 || 99;
            const hidden = prop['hidden'] === 'true';
            const label = prop['label'] || property.toString();
            const dataType = prop['type'] || 'string';
            const required = prop['required'] || false;
            const readOnly = prop['readOnly'] || false;
            // Корректировки даты и логических данных
            // tslint:disable-next-line:max-line-length
            if (dataType === 'date' || dataType === 'datetime') { model[property] = new Date(model[property]) }
            if (dataType === 'boolean') { model[property] = model[property] === undefined ? model.doc[property] : model[property] }
            let newControl: BaseDynamicControl<any>;
            const controlOptions: ControlOptions<any> = {
              key: property, value: model[property] === undefined ? model.doc[property] : model[property],
              label: label, type: docType, required: required, readOnly: readOnly, order: order, hidden: hidden
            };
            switch (dataType) {
              case 'boolean':
                newControl = new BooleanDynamicControl(controlOptions);
                break;
              case 'date':
                newControl = new DateDynamicControl(controlOptions);
                break;
              case 'datetime':
                newControl = new DateDynamicControl(controlOptions);
                break;
              case 'number':
                newControl = new NumberDynamicControl(controlOptions);
                break;
              default:
                if (dataType.includes('.')) {
                  controlOptions.type = dataType; // здесь нужен тип ссылки
                  newControl = new DropdownDynamicControl(controlOptions);
                  break;
                };
                newControl = new TextboxDynamicControl(controlOptions);
                break;
            }
            f.push(newControl);
          });
        };

        process(view, fields);
        const controlsByKey: any = {};
        fields.map(c => { controlsByKey[c.key] = c });
        return {
          view: fields.sort((a, b) => a.order - b.order),
          model: model,
          formGroup: this.fc.toFormGroup(fields),
          controlsByKey: controlsByKey
        }
      });

  }
}

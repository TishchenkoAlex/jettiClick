import { Injectable } from '@angular/core';

import { ApiService } from '../../services/api.service';

import { NumberDynamicControl } from './dynamic-form-number';
import { BooleanDynamicControl } from './dynamic-form-boolean';
import { TextboxDynamicControl } from './dynamic-form-text';
import { DropdownDynamicControl } from './dynamic-form-dropdown';
import { BaseDynamicControl } from './dynamic-form-base';
import { DateDynamicControl } from './dynamic-form-date';

@Injectable()
export class DynamicFormService {

  constructor(private apiService: ApiService) { };

  getControls(docType: string, docID = '') {

    const fields: BaseDynamicControl<any>[] = [];
    const exclude = ['id', 'type', 'posted', 'deleted', 'isfolder', 'parent'];

    if (docType.startsWith('Catalog.')) { exclude.push('date'); }
    if (docType.startsWith('Document.')) { exclude.push('description'); }

    return this.apiService.getViewModel(docType, docID)
      .map(viewModel => {
        const model = viewModel['model'];
        model.date = new Date(model.date);
        const view = viewModel['view'];
        Object.keys(view).map((property) => {
          if (exclude.indexOf(property) > -1 || (view[property].constructor === Array)) { return; }
          const prop = view[property];
          const order = prop['order'] * 1 || 99;
          const hidden = prop['hidden'] === 'true';
          const label = prop['label'] || property.toString();
          const dataType = prop['type'] || 'string';
          const required = prop['required'] || false;
          const readOnly = prop['readOnly'] || false;
          let newControl: BaseDynamicControl<any>;
          const controlOptions = {
            key: property, value: model[property], label: label, type: docType,
            required: required, readOnly: readOnly, order: order
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
                newControl = new DropdownDynamicControl(controlOptions);
                break;
              };
              newControl = new TextboxDynamicControl(controlOptions);
              break;
          }
          fields.push(newControl);
        });
        return { view: fields.sort((a, b) => a.order - b.order), model: model };
      });
  }
}

import { Observable } from 'rxjs/Rx';
import { ApiService } from '../../services/api.service';
import { BooleanDynamicControl } from './dynamic-form-boolean';
import { TextboxDynamicControl } from './dynamic-form-text';
import { DropdownDynamicControl } from './dynamic-form-dropdown';
import { BaseDynamicControl } from './dynamic-form-base';
import { Injectable } from '@angular/core';
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
          // tslint:disable-next-line:curly
          if (exclude.indexOf(property) > -1
            || (view[property].constructor === Array)) return;
          const prop = view[property];
          const order = prop['order'] * 1 || 99;
          const hidden = prop['hidden'] === 'true';
          const label = prop['label'] || property.toString();
          const dataType = prop['type'] || 'string';
          const required = prop['required'] || false;
          let newControl: BaseDynamicControl<any>;
          switch (dataType) {
            case 'boolean':
              if (!model[property]) { model[property] = false; }
              newControl = new BooleanDynamicControl(
                { key: property, value: model[property], label: label, type: docType, required: required, order: order });
              break;
            case 'date':
              newControl = new DateDynamicControl(
                { key: property, value: model[property], label: label, type: docType, required: required, order: order });
              break;
            case 'datetime':
              newControl = new DateDynamicControl(
                { key: property, value: model[property], label: label, type: docType, required: required, order: order });
              break;
            default:
              if (dataType.includes('.')) {
                newControl = new DropdownDynamicControl(
                  { key: property, value: model[property], label: label, type: dataType, required: required, order: order });
                break;
              };
              newControl = new TextboxDynamicControl(
                { key: property, value: model[property], label: label, type: docType, required: required, order: order });
              break;
          }
          fields.push(newControl);
          if (dataType === 'date' || dataType === 'datetime') {
            model[property] = new Date();
          }
        });
        return { view: fields.sort((a, b) => a.order - b.order), model: model };
      });
  }
}

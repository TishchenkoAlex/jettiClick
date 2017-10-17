import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseJettiFromControl } from '../dynamic-form/dynamic-form-base';

export interface FilterObject { action: 'filter'|'search', value: any };
export interface FilterItem {
  active: boolean,
  kind: '=' | '>=' | '<' | '<=' | 'like' | 'is null' | 'not is null',
  value: number | boolean | string
}

export type FilterObjectArr = FilterItem[];

export interface FilterObjectTuple {
  [x: string]: FilterItem
}

@Component({
  selector: 'j-filter-control',
  templateUrl: './filter.control.component.html'
})
export class FilterFormControlComponent {
  @Input() control: BaseJettiFromControl<any>;
  @Input() form: FormGroup;

  createFilter() {
    const filter: FilterObjectTuple = {};
    filter['Amount'] = { active: true, kind: '>=', value: 100 };
  }
}


import { FilterObject } from './filter.control.component';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DocService } from '../../common/doc.service';
import { DynamicFormService, ViewModel } from '../dynamic-form/dynamic-form.service';

@Component({
  selector: 'j-filter',
  styleUrls: ['./filter.component.scss'],
  templateUrl: './filter.component.html',
})
export class FilterFormComponent implements OnInit {

  @Input() docType = '';
  @Output() onChange: EventEmitter<FilterObject> = new EventEmitter<FilterObject>();

  viewModel$: Observable<ViewModel>;
  isDoc: boolean;

  constructor(public docService: DocService, private dfs: DynamicFormService) { }

  ngOnInit() {
    this.viewModel$ = this.dfs.getFilterModel$(this.docType);
  }

  Filter(value) {
    this.onChange.emit({action: 'filter',  value: value})
  }

  Search(value) {
    this.onChange.emit({ action: 'search',  value: value})
  }

}

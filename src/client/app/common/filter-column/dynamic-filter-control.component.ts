import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatInput } from '@angular/material';

import { ColumnDef } from '../../../../server/models/column';
import { FilterInterval } from '../../../../server/models/user.settings';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-filter-form-control',
  templateUrl: './dynamic-filter-control.component.html'
})
export class DynamicFilterControlComponent implements OnInit {
  @Input() columnDef: ColumnDef;
  @ViewChild(MatInput) filter: MatInput;
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;
  @Output() change = new EventEmitter();

  filterInterval = new FilterInterval();

  ngOnInit() {
    if (this.columnDef.type  === 'datetime' || this.columnDef.type  === 'date') {
      if (this.columnDef.filter.right && this.columnDef.filter.right['start']) {
        this.filterInterval = this.columnDef.filter.right as FilterInterval;
        return;
      }
      this.columnDef.filter.right = this.filterInterval;
    }

    if (this.columnDef.type  === 'number') {
      if (this.columnDef.filter.right && this.columnDef.filter.right['start']) {
        this.filterInterval = this.columnDef.filter.right as FilterInterval;
        return;
      }
      this.columnDef.filter.right = this.filterInterval;
    }
  }

  focus() {
    if (this.filter) { this.filter.focus() }
    if (this.autocomplete) { this.autocomplete.matInput.focus() }
  }

  valid() {
    if (this.columnDef.type  === 'datetime' || this.columnDef.type  === 'date') {
    }
    return true;
  }

  onChange(event) {

  }
}

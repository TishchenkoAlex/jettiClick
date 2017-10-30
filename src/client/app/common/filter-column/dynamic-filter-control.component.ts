import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatInput } from '@angular/material';

import { ColumnDef } from '../../../../server/models/column';
import { FilterInterval } from '../../../../server/models/user.settings';
import { UserSettingsService } from '../../auth/settings/user.settings.service';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { getPeriod } from '../utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-filter-form-control',
  templateUrl: './dynamic-filter-control.component.html'
})
export class DynamicFilterControlComponent implements OnInit {
  @Input() columnDef: ColumnDef;
  @ViewChild(MatInput) filter: MatInput;
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;

  filterInterval = new FilterInterval();

  constructor (private cd: ChangeDetectorRef, private uss: UserSettingsService) {}

  ngOnInit() {
    if (this.columnDef.type  === 'datetime' || this.columnDef.type  === 'date') {
      if (this.columnDef.filter.right && this.columnDef.filter.right['start']) {
        this.filterInterval = this.columnDef.filter.right as FilterInterval;
        return;
      }
      this.columnDef.filter.right = this.filterInterval;
      this.columnDef.filter.center = 'beetwen';
    }

    if (this.columnDef.type  === 'number') {
      if (this.columnDef.filter.right && this.columnDef.filter.right['start']) {
        this.filterInterval = this.columnDef.filter.right as FilterInterval;
        return;
      }
      this.columnDef.filter.right = this.filterInterval;
    }

    if (this.columnDef.type  === 'string') {
      this.columnDef.filter.center = 'like'
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
    this.uss.columnDef$.next(JSON.parse(JSON.stringify(this.columnDef)));
  }

  selectPeriod(period: string) {
    const result = getPeriod(period);
      this.filterInterval.start = result.startDate.toJSON();
      this.filterInterval.end = result.endDate.toJSON();
    this.onChange(null);
  }
}

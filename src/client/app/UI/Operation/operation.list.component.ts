import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { take } from 'rxjs/operators';

import { ColumnDef } from '../../../../server/models/column';
import { BaseListComponent } from './../../common/datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dropdown [style]="{'width' : '100%', 'background': 'beige'}"
      [options]="operationsGroups" [ngModel]="super.dataTable.filters['Group']?.value"
      (onChange)="this.super.dataTable.filters['Group'] =
        { matchMode: '=', value: $event.value }; this.super.Sort($event.value)"></p-dropdown>
    <j-list></j-list>
  `
})
export class OperationListComponent implements OnInit {
  @ViewChild(BaseListComponent) super: BaseListComponent;

  operationsGroups: SelectItem[] = [];

  ngOnInit() {
    this.super.ds.api.getOperationsGroups().pipe(take(1)).subscribe(data => {
      this.operationsGroups = data.map(el => <SelectItem>({label: el.value, value: el}));
      this.operationsGroups.unshift({label: '(All)', value: null})
      this.super.dataTable.filters['Group'].value =
        this.super.columns.find(c => c.field === 'Group').filter.right || this.operationsGroups[0].value;
    });
  }

  innerHeight() {
    return window.innerHeight;
  }
}

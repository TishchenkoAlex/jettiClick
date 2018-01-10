import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { take, filter } from 'rxjs/operators';

import { ColumnDef } from '../../../../server/models/column';
import { BaseDocListComponent } from './../../common/datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dropdown [style]="{'width' : '100%', 'background': 'beige'}" [scrollHeight]="500"
      [options]="operationsGroups" [ngModel]="super.dataTable.filters['Group']?.value" [autofocus]="true"
      (onChange)="this.super.dataTable.filters['Group'] =
        { matchMode: '=', value: $event.value }; this.super.Sort($event.value)"></p-dropdown>
    <j-list></j-list>
  `
})
export class OperationListComponent implements OnInit {
  @ViewChild(BaseDocListComponent) super: BaseDocListComponent;

  operationsGroups: SelectItem[] = [];

  ngOnInit() {
    this.super.pageSize = Math.floor((window.innerHeight - 305) / 24);
    this.super.ds.api.getOperationsGroups().pipe(take(1), filter(data => data.length >= 0)).subscribe(data => {
      this.operationsGroups = data.map(el => <SelectItem>({label: el.value, value: el}));
      this.operationsGroups.unshift({label: '(All)', value: null});
      this.super.dataTable.filters['Group'].value =
        this.super.columns.find(c => c.field === 'Group').filter.right || this.operationsGroups[0].value;
    });
  }

}

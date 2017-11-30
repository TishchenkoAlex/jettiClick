import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { take } from 'rxjs/operators';

import { ColumnDef } from '../../../../server/models/column';
import { BaseListComponent } from './../../common/datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dropdown [style]="{'width' : '100%'}" [options]="operationsGroups" [(ngModel)]="selectedColumn?.filter.right"
      (onChange)="super.uss.setFormListSettings(this.super.docType, this.super.formListSettings)"></p-dropdown>
    <j-list></j-list>
  `
})
export class OperationListComponent implements OnInit {
  @ViewChild(BaseListComponent) super: BaseListComponent;

  operationsGroups: SelectItem[] = [];
  selectedColumn: ColumnDef;

  ngOnInit() {
    this.super.ds.api.getOperationsGroups().pipe(take(1)).subscribe(data => {
      this.operationsGroups = data.map(el => <SelectItem>({label: el.value, value: el}));
      this.selectedColumn = this.super.columns.find(c => c.field.toLowerCase() === 'group');
    });
  }

}

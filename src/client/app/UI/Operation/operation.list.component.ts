import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { MatTabGroup } from '@angular/material';
import { take } from 'rxjs/operators';

import { FormListFilter } from '../../../../server/models/user.settings';
import { JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { BaseListComponent } from './../../common/datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'operation.list.component.html',
  styleUrls: ['operation.list.component.scss']
})
export class OperationListComponent implements OnInit, AfterViewInit {
  operationsGroups: JettiComplexObject[];
  get filter() { return this.super.uss.userSettings.formListSettings[this.super.docType].filter || [] };

  @ViewChild(BaseListComponent) super: BaseListComponent;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  ngOnInit() {
    this.super.ds.api.getOperationsGroups().pipe(take(1)).subscribe(data => {
      this.operationsGroups = data;
      const f = this.filter.find(el => el.left === 'Group');
      this.tabGroup.selectedIndex = f ? this.operationsGroups.findIndex(el => el.id === f.right['id']) : -1;
    });
  }

  ngAfterViewInit() {
    this.super.displayedColumns.splice(this.super.displayedColumns.indexOf('Group'), 1); // delete Group column
    // add new column2 & column3
    this.super.displayedColumns.splice(this.super.displayedColumns.indexOf('column2') + 1, 0, 'column3');
  }

  Click(event: JettiComplexObject) {
    const filterValue = {
      id: event.id,
      code: event.code,
      type: event.type,
      value: event.value
    }

    const f: FormListFilter = { left: 'Group', center: '=', right: filterValue };
    const i = this.filter.findIndex(el => el.left === 'Group');
    if (i > -1) { this.filter[i] = f } else { this.filter.push(f) };
    this.super.uss.setFormListSettings(this.super.docType, this.super.uss.userSettings.formListSettings[this.super.docType]);
  }

}

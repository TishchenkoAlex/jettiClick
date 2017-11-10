import { Observable } from 'rxjs/Observable';
import { ChangeDetectionStrategy, Component, ViewChild, OnInit } from '@angular/core';
import { BaseListComponent } from './../../common/datatable/base.list.component';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'operation.list.component.html',
  styleUrls: []
})
export class OperationListComponent implements OnInit, AfterViewInit {
  operationsGroups$: Observable<any[]>;

  @ViewChild(BaseListComponent) super: BaseListComponent;

  ngOnInit() {
    this.operationsGroups$ = this.super.ds.api.getOperationsGroups();
  }

  ngAfterViewInit() {
    this.super.displayedColumns.splice(this.super.displayedColumns.indexOf('Group'), 1);
    this.super.displayedColumns.splice(this.super.displayedColumns.indexOf('column2') + 1, 0, 'column3');
  }

  Click(event) {
    const filterValue = {
      id: event.id,
      code: event.code,
      type: 'Catalog.Operation.Group',
      value: event.description
  }

    const filter =  this.super.uss.userSettings.formListSettings[this.super.docType].filter;
    const i = filter.findIndex(el => el.left === 'Group');
    if (i > -1) {
      filter[i] = {left: 'Group', center: '=', right: filterValue}
    } else {
      filter.push({left: 'Group', center: '=', right: filterValue})
    }
    this.super.uss.setFormListSettings(this.super.docType, this.super.uss.userSettings.formListSettings[this.super.docType]);
  }

}

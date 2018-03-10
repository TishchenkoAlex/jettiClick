import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/components/common/selectitem';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { BaseDocListComponent } from './../../common/datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dropdown (onChange)="onChange($event)"
      [style]="{'width' : '100%'}"
      [scrollHeight]="500"
      [filter]="true"
      [showClear]="true"
      [options]="operationsGroups$ | async"
      [ngModel]="super.table?.filters['Group']?.value" [autofocus]="true">
    </p-dropdown>
    <j-list></j-list>`
})
export class OperationListComponent implements OnInit {
  @ViewChild(BaseDocListComponent) super: BaseDocListComponent;

  operationsGroups$: Observable<SelectItem[]>;

  ngOnInit() {
    this.super.pageSize = Math.floor((window.innerHeight - 305) / 24);
    this.operationsGroups$ = this.super.ds.api.getOperationsGroups().pipe(
      map(data => [
        { label: '(All)', value: null },
        ...data.map(el => <SelectItem>({ label: el.value, value: el })) || []
      ]));
  }

  onChange(event) {
    this.super.table.filters.Group = { matchMode: '=', value: event.value };
    this.super.sort(event);
  }

}

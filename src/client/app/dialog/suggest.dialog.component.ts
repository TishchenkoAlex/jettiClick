import { Subscription } from 'rxjs/Rx';
import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MD_DIALOG_DATA, MdPaginator, MdSort, MdDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { ApiDataSource } from '../common/datatable/datatable.component';
import { ApiService } from '../services/api.service';

@Component({
  templateUrl: './suggest.dialog.component.html',
  styleUrls: ['./suggest.dialog.component.scss']
})
export class SuggestDialogComponent implements OnInit, OnDestroy {

  private _filter$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null;
  selection = new SelectionModel<string>(true, []);

  columns = ['select', 'posted', 'description'];

  @ViewChild(MdSort) sort: MdSort;
  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;

  constructor(public dialogRef: MdDialogRef<any>, @Inject(MD_DIALOG_DATA) public data: any, private apiService: ApiService) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.paginator, this.sort);
    this.dataSource.selectedColumn = 'description';
    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup')
    .startWith('')
    .debounceTime(1000)
    .distinctUntilChanged()
    .subscribe(() => {
      if (!this.dataSource) { return; }
      this.dataSource.filterObjext = {
        startDate: null,
        endDate: null,
        columnFilter: this.filter.nativeElement.value
      };
    });
  }

  ngOnDestroy() {
    this._filter$.unsubscribe();
  }

  isAllSelected(): boolean {
    if (!this.dataSource) { return false; }
    if (this.selection.isEmpty()) { return false; }
    return this.selection.selected.length >= this.dataSource.renderedData.length;
  }

  masterToggle() {
    if (!this.dataSource) { return; }
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.renderedData.forEach(data => this.selection.select(data));
    }
  }

}



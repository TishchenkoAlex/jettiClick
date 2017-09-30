import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatPaginator, MatSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { ApiDataSource } from '../common/datatable/datatable.component';
import { DocModel } from '../common/doc.model';
import { ApiService } from '../services/api.service';

@Component({
  templateUrl: './suggest.dialog.component.html',
  styleUrls: ['./suggest.dialog.component.scss']
})
export class SuggestDialogComponent implements OnInit, OnDestroy {

  private _filter$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null;
  selection = new SelectionModel<DocModel>(true, []);

  columns = ['select', 'posted', 'description'];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;

  constructor(public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any, private apiService: ApiService) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.sort, this.selection);
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

  first() {

  }

  last() {

  }

  next() {

  }

  prev() {

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



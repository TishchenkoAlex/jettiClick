import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ApiDataSource } from '../common/datatable/api.datasource';
import { ApiService } from '../services/api.service';

@Component({
  templateUrl: './suggest.dialog.component.html',
  styleUrls: ['./suggest.dialog.component.scss']
})
export class SuggestDialogComponent implements OnInit, OnDestroy {

  private _filter$: Subscription = Subscription.EMPTY;
  isDoc: boolean;

  dataSource: ApiDataSource | null;

  columns = ['select', 'posted', 'description', 'code'];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any, private apiService: ApiService) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, 7, this.sort);
    this.dataSource.selectedColumn = 'description';
    this.sort.direction = 'asc';
    this.isDoc = this.data.docType.startsWith('Document.') || this.data.docType.startsWith('Journal.');
    if (this.isDoc) { this.sort.active = 'date'; } else { this.sort.active = 'description'; }
    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .distinctUntilChanged()
      .debounceTime(1000)
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filterObjext = {
          startDate: null,
          endDate: null,
          columnFilter: this.filter.nativeElement.value
        };
      });

    if (!this.data.docID || (this.data.docID === this.data.docType)) {
      this.dataSource.paginator.next('first');
    } else {
      this.dataSource.selectedID = this.data.docID;
    }
  }

  ngOnDestroy() {
    this._filter$.unsubscribe();
  }

}



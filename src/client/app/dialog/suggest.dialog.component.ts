import { ChangeDetectionStrategy, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ApiDataSource } from '../common/datatable/api.datasource';
import { LoadingService } from '../common/loading.service';
import { ApiService } from '../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './suggest.dialog.component.html',
  styleUrls: ['./suggest.dialog.component.scss']
})
export class SuggestDialogComponent implements OnInit, OnDestroy {

  private _filter$: Subscription = Subscription.EMPTY;
  isDoc: boolean;
  pageSize = 10;

  dataSource: ApiDataSource | null;

  columns = ['select', 'posted', 'description', 'code'];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService, private lds: LoadingService) { }

  ngOnInit() {
    this.isDoc = this.data.docType.startsWith('Document.') || this.data.docType.startsWith('Journal.');
    if (this.isDoc) { this.sort.active = 'date'; } else { this.sort.active = 'description'; }
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.pageSize, this.sort, this.lds);

    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .distinctUntilChanged()
      .debounceTime(1000)
      .subscribe((value: string) => {
        this.dataSource.selection.clear();
        this.dataSource.filterObject = {
          action: 'filter', value: {description: this.filter.nativeElement.value}}
        });


    if (!this.data.docID || (this.data.docID === this.data.docType)) {
      this.dataSource.first()
    } else { this.dataSource.goto(this.data.docID) }
  }

  ngOnDestroy() {
    this._filter$.unsubscribe();
  }

}


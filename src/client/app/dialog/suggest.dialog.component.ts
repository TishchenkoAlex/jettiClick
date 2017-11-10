import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { UserSettingsService } from '../auth/settings/user.settings.service';
import { ApiDataSource } from '../common/datatable/api.datasource';
import { ApiService } from '../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './suggest.dialog.component.html',
  styleUrls: ['./suggest.dialog.component.scss']
})
export class SuggestDialogComponent implements OnInit, AfterViewInit, OnDestroy {

  private _sortChange$: Subscription = Subscription.EMPTY;
  private _filter$: Subscription = Subscription.EMPTY;
  isDoc: boolean;
  pageSize = 10;

  dataSource: ApiDataSource | null;

  columns = ['select', 'posted', 'description', 'code'];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService, private uss: UserSettingsService) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.pageSize, this.uss);
  }

  ngAfterViewInit() {
    if (!this.dataSource) { return };
    if (!this.data.docID || (this.data.docID === this.data.docType)) {
      this.dataSource.first()
    } else { this.dataSource.goto(this.data.docID) }

    this._sortChange$ = this.sort.sortChange.subscribe(() => {
      this.update();
    });

    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup').pipe(
      distinctUntilChanged(),
      debounceTime(500))
      .subscribe((value: string) => {
        this.dataSource.selection.clear();
        this.update();
      });
  }

  private update() {
    this.uss.formListSettings$.next({
      type: this.data.docType,
      payload: {
        filter: [
          { left: 'description', center: 'like', right: this.filter.nativeElement.value }
        ],
        order: [
          { field: this.sort.active, order: this.sort.direction }
        ]
      }
    });
  }

  ngOnDestroy() {
    this._filter$.unsubscribe();
    this._sortChange$.unsubscribe();
  }

}

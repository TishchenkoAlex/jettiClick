import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
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

  dataSource: ApiDataSource | null = null;
  get isDoc() { return (this.data.docType as string).startsWith('Document.') };

  @Input() pageSize = 10;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  columns = []; additianalColumn1; additianalColumn2;

  constructor(public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService, private uss: UserSettingsService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.pageSize, this.uss, this.sort);
    this.apiService.getDocDimensions(this.data.docType).pipe(take(1))
      .subscribe(data => {
        this.columns = ['select', 'posted', 'description', 'code'];
        if (data.length > 0) {
          this.additianalColumn1 = data[0]; this.columns.push(data[0]);
        }
        if (data.length > 2) {
          this.additianalColumn2 = data[2]; this.columns.push(data[2]);
        }
        if (this.isDoc) { this.columns.push('Amount') };
      })
  }

  ngAfterViewInit() {
    if (!this.dataSource) { return };
    if (!this.data.docID || (this.data.docID === this.data.docType)) {
      this.dataSource.first()
    } else { this.dataSource.goto(this.data.docID) }

    if (this.sort) {
      this._sortChange$ = this.sort.sortChange.subscribe(() => this.update());
    }

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

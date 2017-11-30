import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DataTable, SortMeta } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { FormListOrder } from '../../../server/models/user.settings';
import { UserSettingsService } from '../auth/settings/user.settings.service';
import { ApiDataSource } from '../common/datatable/api.datasource.v2';
import { ApiService } from '../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-suggest-list',
  templateUrl: './suggest.dialog.component.html',
})
export class SuggestDialogComponent implements OnInit, AfterViewInit, OnDestroy {

  private _filter$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null = null;

  @Input() pageSize = 15;
  @Input() docType = '';
  @Input() docID = '';
  @Output() onSelect = new EventEmitter();

  @ViewChild('filter') filter: ElementRef;
  @ViewChild(DataTable) dataTable: DataTable = null;

  get isDoc() { return this.docType.startsWith('Document.') || this.docType.startsWith('Journal.') }
  additianalColumn1 = ''; additianalColumn2 = '';

  constructor(
    private apiService: ApiService, private uss: UserSettingsService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.docType, this.pageSize, null, this.uss);

    this.apiService.getDocDimensions(this.docType).pipe(take(1))
      .subscribe(data => {
        if (data.length > 0) { this.additianalColumn1 = data[0] }
        if (data.length > 2) { this.additianalColumn2 = data[2] }
      })
  }

  ngAfterViewInit() {
    this.filter.nativeElement.focus();
    this.dataSource.dataTable = this.dataTable;
    if (!this.docID || (this.docID === this.docType)) {
      this.dataSource.first()
    } else { this.dataSource.goto(this.docID) }

    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup').pipe(
      distinctUntilChanged(),
      debounceTime(500))
      .subscribe(() => this.update());
  }

  update() {
    this.dataSource.dataTable.selection = null;
    this.uss.formListSettings$.next({
      type: this.docType,
      payload: {
        filter: [
          { left: 'description', center: 'like', right: this.filter.nativeElement.value }
        ],
        order: ((<SortMeta[]>this.dataTable.multiSortMeta) || [])
          .map(e => <FormListOrder>{ field: e.field, order: e.order === 1 ? 'asc' : 'desc' })
      }
    });
  }

  onSelectHandler = (row) => this.onSelect.emit(row);
  ngOnDestroy = () => this._filter$.unsubscribe();

}

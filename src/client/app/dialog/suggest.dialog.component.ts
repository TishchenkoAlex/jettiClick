import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { SortMeta } from 'primeng/components/common/sortmeta';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { ColumnDef } from '../../../server/models/column';
import { DocumentBase, DocumentOptions } from '../../../server/models/document';
import { createDocument } from '../../../server/models/documents.factory';
import { FormListFilter, FormListOrder, FormListSettings } from '../../../server/models/user.settings';
import { ApiDataSource } from '../common/datatable/api.datasource.v2';
import { Table } from '../common/datatable/table';
import { calendarLocale, dateFormat } from '../primeNG.module';
import { ApiService } from '../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-suggest-list',
  templateUrl: './suggest.dialog.component.html'
})
export class SuggestDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() type;
  @Input() id;
  @Input() pageSize = 18;
  @Input() settings: FormListSettings = new FormListSettings();
  @Output() Select = new EventEmitter();
  @ViewChild(Table) table: Table = null;
  // tslint:disable:max-line-length
  columns: ColumnDef[] = [];
  doc: DocumentBase;

  get isDoc() { return this.type.startsWith('Document.'); }
  get isCatalog() { return this.type.startsWith('Catalog.'); }

  locale = calendarLocale; dateFormat = dateFormat;
  dataSource: ApiDataSource | null = null;
  private debonce$ = new Subject<{ col: any, event: any, center: string }>();

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.api, this.type, this.pageSize);
    const data = [{ description: 'string' }, { code: 'string' }, { id: 'string' }];
    this.doc = createDocument(this.type as any);
    const schema = this.doc ? this.doc.Props() : {};
    const dimensions = this.doc ? (this.doc.Prop() as DocumentOptions).dimensions || [] : [];
    [...data, ...dimensions].forEach(el => {
      const field = Object.keys(el)[0]; const type = el[field];
      this.columns.push({
        field, type: schema[field] && schema[field].type || type, label: schema[field] && schema[field].label || field,
        hidden: !!(schema[field] && schema[field].hidden), required: true, readOnly: false, sort: new FormListOrder(field),
        order: schema[field] && schema[field].order || 0, style: schema[field] && schema[field].style || { width: '150px' },
      });
    });
    this.columns = this.columns.filter(c => !c.hidden);
  }

  ngAfterViewInit() {
    this.setSortOrder();
    this.setFilters();
    this.dataSource.formListSettings.next(this.settings);
    this.dataSource.goto(this.id);
    this.table.preventSelectionSetterPropagation = false;
    this.table.selection = [{ id: this.id, type: this.type }];

    this.debonce$.pipe(debounceTime(500))
      .subscribe(event => this._update(event.col, event.event, event.center));
  }

  private setFilters() {
    if (this.settings.filter.length) {
      this.settings.filter
        .filter(f => f.right)
        .forEach(f => this.table.filters[f.left] = { matchMode: f.center, value: f.right });
    }
  }

  private setSortOrder() {
    this.table.multiSortMeta = this.columns
      .map(c => c.sort)
      .filter(e => !!e.order)
      .map(e => <SortMeta>{ field: e.field, order: e.order === 'asc' ? 1 : -1 });
  }

  private _update(col: ColumnDef, event, center) {
    if ((event instanceof Array) && event[1]) { event[1].setHours(23, 59, 59, 999); }
    this.table.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.sort();
  }
  update(col: ColumnDef, event, center = 'like') {
    if (!event || (typeof event === 'object' && !event.value && !(event instanceof Array))) { event = null; }
    this.debonce$.next({ col, event, center });
  }

  sort() {
    this.prepareDataSource();
    this.dataSource.sort();
  }

  private prepareDataSource() {
    this.dataSource.id = this.table.selection && this.table.selection.length ? this.table.selection[0].id : '';
    const order = (this.table.multiSortMeta || [])
      .map(el => <FormListOrder>({ field: el.field, order: el.order === -1 ? 'desc' : 'asc' }));
    const filter = Object.keys(this.table.filters)
      .map(f => <FormListFilter>{ left: f, center: this.table.filters[f].matchMode, right: this.table.filters[f].value });
    const state: FormListSettings = { filter, order };
    this.dataSource.formListSettings.next(state);
  }

  open(event) {
    this.Select.emit(event);
  }

  ngOnDestroy() {
    this.debonce$.unsubscribe();
  }
}

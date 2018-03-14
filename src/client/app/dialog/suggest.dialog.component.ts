import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  isDevMode,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FilterMetadata } from 'primeng/components/common/filtermetadata';
import { SortMeta } from 'primeng/components/common/sortmeta';
import { Observable } from 'rxjs/Observable';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { ColumnDef } from '../../../server/models/column';
import { DocumentBase, DocumentOptions } from '../../../server/models/document';
import { createDocument } from '../../../server/models/documents.factory';
import { FormListFilter, FormListOrder, FormListSettings } from '../../../server/models/user.settings';
import { ApiDataSource } from '../common/datatable/api.datasource.v2';
import { calendarLocale, dateFormat } from '../primeNG.module';
import { ApiService } from '../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-suggest-list',
  templateUrl: './suggest.dialog.component.html'
})
export class SuggestDialogComponent implements OnInit, OnDestroy {
  @Input() type;
  @Input() id;
  @Input() pageSize = 250;
  @Input() settings: FormListSettings = new FormListSettings();
  @Output() Select = new EventEmitter();
  doc: DocumentBase;

  private readonly _columnsAndMetadata$ = new Subject<{ columns: ColumnDef[], metadata: DocumentOptions }>();
  columnsAndMetadata$ = this._columnsAndMetadata$.asObservable();

  columns$: Observable<ColumnDef[]>;
  selection = [];
  filters: { [s: string]: FilterMetadata } = {};
  multiSortMeta: SortMeta[] = [];

  get isDoc() { return this.type.startsWith('Document.'); }
  get isCatalog() { return this.type.startsWith('Catalog.'); }

  locale = calendarLocale; dateFormat = dateFormat;
  dataSource: ApiDataSource | null = null;
  private debonce$ = new Subject<{ col: any, event: any, center: string }>();

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.columns$ = this.columnsAndMetadata$.pipe(
      startWith({}),
      tap(d => {
        this.setSortOrder();
        this.setFilters();
        this.selection[0] = { id: this.id, type: this.type };
      }),
      map(() => {
        const columns: ColumnDef[] = [];
        const data = [{ description: 'string' }, { code: 'string' }, { id: 'string' }];
        this.doc = createDocument(this.type as any);
        const schema = this.doc ? this.doc.Props() : {};
        const dimensions = this.doc ? (this.doc.Prop() as DocumentOptions).dimensions || [] : [];
        [...data, ...dimensions].forEach(el => {
          const field = Object.keys(el)[0]; const type = el[field];
          columns.push({
            field, type: schema[field] && schema[field].type || type, label: schema[field] && schema[field].label || field,
            hidden: !!(schema[field] && schema[field].hidden), required: true, readOnly: false, sort: new FormListOrder(field),
            order: schema[field] && schema[field].order || 0, style: schema[field] && schema[field].style || { width: '150px' },
          });
        });
        return columns.filter(c => !c.hidden);
      }));

    this.debonce$.pipe(debounceTime(500))
      .subscribe(event => this._update(event.col, event.event, event.center));

    this.dataSource = new ApiDataSource(this.api, this.type, this.pageSize, true);
  }

  private setFilters() {
    this.settings.filter
      .filter(c => !!c.right)
      .forEach(f => this.filters[f.left] = { matchMode: f.center, value: f.right });
  }

  private setSortOrder() {
    this.multiSortMeta = this.settings.order
      .filter(e => !!e.order)
      .map(e => <SortMeta>{ field: e.field, order: e.order === 'asc' ? 1 : -1 });
  }

  private _update(col: ColumnDef, event, center) {
    if ((event instanceof Array) && event[1]) { event[1].setHours(23, 59, 59, 999); }
    this.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.prepareDataSource(this.multiSortMeta);
    this.dataSource.sort();
  }
  update(col: ColumnDef, event, center = 'like') {
    if (!event || (typeof event === 'object' && !event.value && !(event instanceof Array))) { event = null; }
    this.debonce$.next({ col, event, center });
  }

  onLazyLoad(event) {
    if (isDevMode()) console.log('onLazyLoad', event);
    this.prepareDataSource(event.multiSortMeta);
    this.dataSource.sort();
  }

  prepareDataSource(multiSortMeta: SortMeta[] = []) {
    this.dataSource.id = this.id.id;
    const order = multiSortMeta
      .map(el => <FormListOrder>({ field: el.field, order: el.order === -1 ? 'desc' : 'asc' }));
    const filter = Object.keys(this.filters)
      .map(f => <FormListFilter>{ left: f, center: this.filters[f].matchMode, right: this.filters[f].value });
    this.dataSource.formListSettings.next({ filter, order });
  }

  open(event) {
    this.Select.emit(event);
  }

  ngOnDestroy() {
    this.debonce$.complete();
    this.debonce$.unsubscribe();
  }
}

import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/components/common/menuitem';
import { SortMeta } from 'primeng/components/common/sortmeta';
import { Observable } from 'rxjs/Observable';
import { merge } from 'rxjs/observable/merge';
import { debounceTime, filter as filter$, map, take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { v1 } from 'uuid';

import { ColumnDef } from '../../../../server/models/column';
import { DocTypes } from '../../../../server/models/documents.types';
import { FormListFilter, FormListOrder, FormListSettings } from '../../../../server/models/user.settings';
import { calendarLocale, dateFormat } from '../../primeNG.module';
import { DocumentOptions } from './../../../../server/models/document';
import { createDocument } from './../../../../server/models/documents.factory';
import { UserSettingsService } from './../../auth/settings/user.settings.service';
import { ApiDataSource } from './../../common/datatable/api.datasource.v2';
import { DocService } from './../../common/doc.service';
import { LoadingService } from './../../common/loading.service';
import { Table } from './table';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list',
  templateUrl: 'base.list.component.html',
})
export class BaseDocListComponent implements OnInit, OnDestroy, AfterViewInit {
  locale = calendarLocale; dateFormat = dateFormat;

  constructor(public route: ActivatedRoute, public router: Router, public ds: DocService,
    public uss: UserSettingsService, public lds: LoadingService) { }

  private _docSubscription$: Subscription = Subscription.EMPTY;
  private _routeSubscruption$: Subscription = Subscription.EMPTY;

  private debonce$ = new Subject<{ col: any, event: any, center: string }>();

  @Input() pageSize = Math.floor((window.innerHeight - 275) / 24);
  @Input() type: DocTypes = this.route.snapshot.params.type;
  @Input() settings: FormListSettings = this.route.snapshot.data.detail.settings;

  get isDoc() { return this.type.startsWith('Document.'); }
  get isCatalog() { return this.type.startsWith('Catalog.'); }
  get id() { return { id: this.selection && this.selection.length ? this.selection[0].id : '', posted: true }; }
  set id(value: { id: string, posted: boolean }) {
    this.selection = [{ id: value.id, type: this.type, posted: value.posted }];
  }
  _columnsAndMetadata$ = new Subject<{ columns: ColumnDef[], metadata: DocumentOptions }>();
  columnsAndMetadata$ = this._columnsAndMetadata$.asObservable();

  columns$: Observable<ColumnDef[]>;
  selection = [];

  contexCommands: MenuItem[] = [];
  ctxData = { column: '', value: undefined };
  showTree = false;

  dataSource: ApiDataSource | null = null;
  @ViewChild(Table) table: Table = null;

  ngOnInit() {
    this.columns$ = this.columnsAndMetadata$.pipe(
      map(d => d.columns.filter(c => (!c.hidden && !(c.field === 'description' && this.isDoc)) || c.field === 'Group')));

    this.dataSource = new ApiDataSource(this.ds.api, this.type, this.pageSize);

    this._docSubscription$ = merge(...[this.ds.save$, this.ds.delete$, this.ds.saveClose$, this.ds.goto$]).pipe(
      filter$(doc => doc && doc.type === this.type))
      .subscribe(doc => {
        const exist = (this.dataSource.renderedData).find(d => d.id === doc.id);
        if (exist) {
          this.dataSource.refresh(exist.id);
          this.id = { id: exist.id, posted: exist.posted };
        } else {
          this.dataSource.goto(doc.id);
          this.id = { id: doc.id, posted: doc.posted };
        }
      });

    // обработка команды найти в списке
    this._routeSubscruption$ = this.route.queryParams.pipe(
      filter$(params => this.route.snapshot.params.type === this.type && params.goto && !this.route.snapshot.params.id))
      .subscribe(params => {
        const exist = this.dataSource.renderedData.find(d => d.id === params.goto);
        if (exist) {
          this.dataSource.refresh(exist.id);
          this.router.navigate([this.type], { replaceUrl: true })
            .then(() => this.id = { id: exist.id, posted: exist.posted });
        } else {
          this.table.filters = {};
          this.router.navigate([this.type], { replaceUrl: true })
            .then(() => {
              this.prepareDataSource();
              this.dataSource.goto(params.goto);
              this.id = { id: params.goto, posted: true };
            });
        }
      });

    this.debonce$.pipe(debounceTime(500)).subscribe(event => this._update(event.col, event.event, event.center));
  }

  ngAfterViewInit() {
    this.columnsAndMetadata$.pipe(take(1)).subscribe(d => {
      this.setSortOrder(d.columns);
      this.setFilters();
      this.setContextMenu(d.columns, d.metadata);
      this.dataSource.formListSettings.next(this.settings);
      this.dataSource.first();
    });

    const metadata = this.route.snapshot.data.detail.metadata || {};
    const columns = this.route.snapshot.data.detail.columnsDef || [];

    if (columns.length) {
      this._columnsAndMetadata$.next({ columns, metadata });
    } else {
      this.ds.api.getView(this.type).pipe(take(1)).subscribe(r => {
        this._columnsAndMetadata$.next({ columns: r.columnsDef, metadata: r.metadata });
      });
    }

  }

  private setFilters() {
    if (this.settings.filter.length) {
      this.settings.filter
        .forEach(f => this.table.filters[f.left] = { matchMode: f.center, value: f.right });
    }
  }

  private setSortOrder(columns: ColumnDef[]) {
    this.table.multiSortMeta = columns
      .map(c => c.sort)
      .filter(e => !!e.order)
      .map(e => <SortMeta>{ field: e.field, order: e.order === 'asc' ? 1 : -1 });
  }

  private setContextMenu(columns: ColumnDef[], metadata: DocumentOptions) {
    this.contexCommands = [
      {
        label: 'Select (All)', icon: 'fa-check-square',
        command: (event) => this.selection = this.dataSource.renderedData
      },
      {
        label: 'Quick filter', icon: 'fa-search',
        command: (event) => this._update(columns.find(c => c.field === this.ctxData.column), this.ctxData.value, null)
      },
      ...(metadata.copyTo || []).map(el => {
        const { description, icon } = createDocument(el).Prop() as DocumentOptions;
        return <MenuItem>{ label: description, icon, command: (event) => this.copyTo(el) };
      })];
  }

  private _update(col: ColumnDef, event, center) {
    if ((event instanceof Array) && event[1]) { event[1].setHours(23, 59, 59, 999); }
    this.table.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.sort(event);
  }
  update(col: ColumnDef, event, center = 'like') {
    if (!event || (typeof event === 'object' && !event.value && !(event instanceof Array))) { event = null; }
    this.debonce$.next({ col, event, center });
  }

  sort(event) {
    this.prepareDataSource();
    this.dataSource.sort();
  }

  private prepareDataSource() {
    this.dataSource.id = this.id.id;
    const order = (this.table.multiSortMeta || [])
      .map(el => <FormListOrder>({ field: el.field, order: el.order === -1 ? 'desc' : 'asc' }));
    const filter = Object.keys(this.table.filters)
      .map(f => <FormListFilter>{ left: f, center: this.table.filters[f].matchMode, right: this.table.filters[f].value });
    const state: FormListSettings = { filter, order };
    this.dataSource.formListSettings.next(state);
  }

  add() {
    const filters = {};
    Object.keys(this.table.filters)
      .filter(f => this.table.filters[f].value && this.table.filters[f].value.id)
      .forEach(f => filters[f] = this.table.filters[f].value.id);
    const id = v1();
    this.router.navigate([this.type, id],
      { queryParams: { new: id, ...filters } });
  }

  copy() {
    this.router.navigate([this.selection[0].type, v1()],
      { queryParams: { copy: this.selection[0].id } });
  }

  copyTo(type: DocTypes) {
    this.router.navigate([type, v1()],
      { queryParams: { base: this.selection[0].id } });
  }

  open() {
    this.router.navigate([this.selection[0].type, this.selection[0].id]);
  }

  delete() {
    this.selection.forEach(el => this.ds.delete(el.id));
  }

  async post(mode = 'post') {
    const tasksCount = this.selection.length; let i = tasksCount;
    for (const s of this.selection) {
      this.lds.counter = Math.round(100 - ((--i) / tasksCount * 100));
      if (mode === 'post') {
        await this.ds.post(s.id);
        s.posted = (await this.ds.post(s.id));
      } else {
        s.posted = !(await this.ds.unpost(s.id));
      }
      this.selection = [s];
    }
    this.lds.counter = 0;
    this.dataSource.refresh(this.selection[0].id);
  }

  parentChange(event) {
    this.table.filters['parent'] = { matchMode: '=', value: event && event.data ? event.data.id : null };
    this.sort(event);
  }

  onContextMenuSelect(event) {
    let el = (event.originalEvent as MouseEvent).srcElement;
    while (!el.id && el.lastElementChild) { el = el.lastElementChild; }
    const value = event.data[el.id];
    this.ctxData = { column: el.id, value: value && value.id ? value : value };
    this.id = { id: value.id, posted: value.posted };
  }

  private saveUserSettings() {
    const formListSettings: FormListSettings = {
      filter: (Object.keys(this.table.filters) || [])
        .map(f => (<FormListFilter>{ left: f, center: this.table.filters[f].matchMode, right: this.table.filters[f].value })),
      order: ((<SortMeta[]>this.table.multiSortMeta) || [])
        .map(o => <FormListOrder>{ field: o.field, order: o.order === 1 ? 'asc' : 'desc' })
    };
    this.uss.setFormListSettings(this.type, formListSettings);
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._routeSubscruption$.unsubscribe();
    this.debonce$.complete();
    this.debonce$.unsubscribe();
    if (!this.route.snapshot.queryParams.goto) { this.saveUserSettings(); }
  }

}

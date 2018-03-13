import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterMetadata } from 'primeng/components/common/filtermetadata';
import { MenuItem } from 'primeng/components/common/menuitem';
import { SortMeta } from 'primeng/components/common/sortmeta';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { merge } from 'rxjs/observable/merge';
import { debounceTime, filter as filter$, map, take, tap } from 'rxjs/operators';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list',
  templateUrl: 'base.list.component.html',
})
export class BaseDocListComponent implements OnInit, OnDestroy {
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

  private readonly _columnsAndMetadata$ = new BehaviorSubject<{ columns: ColumnDef[], metadata: DocumentOptions }>({
    columns: this.route.snapshot.data.detail.columnsDef || [],
    metadata: this.route.snapshot.data.detail.metadata || {}
  });
  columnsAndMetadata$ = this._columnsAndMetadata$.asObservable();

  columns$: Observable<ColumnDef[]>;
  selection = [];
  filters: { [s: string]: FilterMetadata } = {};
  multiSortMeta: SortMeta[] = [];

  contexCommands: MenuItem[] = [];
  ctxData = { column: '', value: undefined };
  showTree = false;

  dataSource: ApiDataSource | null = null;

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.ds.api, this.type, this.pageSize);

    if (!this._columnsAndMetadata$.value.columns.length) {
      this.ds.api.getView(this.type).pipe(take(1)).subscribe(r => {
        this._columnsAndMetadata$.next({ columns: r.columnsDef, metadata: r.metadata });
      });
    }

    this.columns$ = this.columnsAndMetadata$.pipe(
      tap(d => {
        this.setSortOrder();
        this.setFilters();
        this.setContextMenu(d.columns, d.metadata);
      }),
      map(d =>
        d.columns.filter(c => (!c.hidden && !(c.field === 'description' && this.isDoc)) || c.field === 'Group')
      ));

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
          this.filters = {};
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
    this.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.prepareDataSource();
    this.dataSource.sort();
  }
  update(col: ColumnDef, event, center = 'like') {
    if (!event || (typeof event === 'object' && !event.value && !(event instanceof Array))) { event = null; }
    this.debonce$.next({ col, event, center });
  }

  onLazyLoad(event) {
    if (isDevMode()) console.log('onLazyLoad', event);
    this.multiSortMeta = event.multiSortMeta || [];
    this.prepareDataSource();
    this.dataSource.sort();
  }

  prepareDataSource() {
    this.dataSource.id = this.id.id;
    const order = this.multiSortMeta
      .map(el => <FormListOrder>({ field: el.field, order: el.order === -1 ? 'desc' : 'asc' }));
    const filter = Object.keys(this.filters)
      .map(f => <FormListFilter>{ left: f, center: this.filters[f].matchMode, right: this.filters[f].value });
    this.dataSource.formListSettings.next({ filter, order });
  }

  add() {
    const filters = {};
    Object.keys(this.filters)
      .filter(f => this.filters[f].value && this.filters[f].value.id)
      .forEach(f => filters[f] = this.filters[f].value.id);
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
    this.filters['parent'] = { matchMode: '=', value: event && event.data ? event.data.id : null };
    this.prepareDataSource();
    this.dataSource.sort();
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
      filter: (Object.keys(this.filters) || [])
        .map(f => (<FormListFilter>{ left: f, center: this.filters[f].matchMode, right: this.filters[f].value })),
      order: ((<SortMeta[]>this.multiSortMeta) || [])
        .map(o => <FormListOrder>{ field: o.field, order: o.order === 1 ? 'asc' : 'desc' })
    };
    this.uss.setFormListSettings(this.type, formListSettings);
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._routeSubscruption$.unsubscribe();
    this._columnsAndMetadata$.complete();
    this.debonce$.complete();
    this.debonce$.unsubscribe();
    if (!this.route.snapshot.queryParams.goto) { this.saveUserSettings(); }
  }

}

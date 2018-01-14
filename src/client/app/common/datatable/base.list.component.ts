import { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTable, MenuItem, SortMeta } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { debounceTime, filter, share, take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { DocTypes } from '../../../../server/models/documents.types';
import { FormListFilter, FormListOrder, FormListSettings } from '../../../../server/models/user.settings';
import { calendarLocale, dateFormat } from '../../primeNG.module';
import { DocumentBase, DocumentOptions } from './../../../../server/models/document';
import { createDocument } from './../../../../server/models/documents.factory';
import { UserSettingsService } from './../../auth/settings/user.settings.service';
import { ApiDataSource } from './../../common/datatable/api.datasource.v2';
import { DocService } from './../../common/doc.service';
import { LoadingService } from './../../common/loading.service';
import { merge } from 'rxjs/observable/merge';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list',
  templateUrl: 'base.list.component.html',
})
export class BaseDocListComponent implements OnInit, OnDestroy, AfterViewInit {
  locale = calendarLocale; dateFormat = dateFormat;

  private _docSubscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;

  private _debonce = new Subject<{ col: any, event: any, center: string }>();
  private debonce$ = this._debonce.asObservable();

  dataSource: ApiDataSource | null = null;
  data$: Observable<DocumentBase[]>;

  @ViewChild(DataTable) dataTable: DataTable = null;

  private AfterViewInit = false;
  pageSize = 0;
  docType: DocTypes;
  columns: ColumnDef[] = [];
  contexCommands: MenuItem[] = [];
  ctxData = { column: '', value: undefined };
  showTree = false;
  docModel: DocumentBase;
  selection: DocumentBase[] = [];

  constructor(public route: ActivatedRoute, public router: Router, public ds: DocService,
    public uss: UserSettingsService, public lds: LoadingService) {
    this.pageSize = Math.floor((window.innerHeight - 275) / 24);
    this.debonce$.pipe(filter(event => this.AfterViewInit), debounceTime(500))
      .subscribe(event => this._update(event.col, event.event, event.center));
  }

  ngOnInit() {
    this.docType = this.route.params['value'].type;
    const view = this.route.data['value'].detail[0]['view'];

    this.columns = this.route.data['value'].detail[0]['columnDef'];
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize);
    this.data$ = this.dataSource.result$.pipe(share());

    this.docModel = createDocument(this.docType);

    const exclCol = this.docModel.isDoc ? ['description'] : ['date', 'company'];
    this.columns.forEach(c => { if (exclCol.indexOf(c.field) > -1 || c.hidden) { c.style['display'] = 'none'; } });
    this.columns = this.columns.filter(c => c.style['display'] !== 'none' || c.field === 'Group');

    this.contexCommands = [{
      label: 'Quick filter', icon: 'fa-search', command: (event) =>
        this._update(this.columns.find(c => c.field === this.ctxData.column), this.ctxData.value, null)
    },
    ...((this.docModel.Prop() as DocumentOptions).copyTo || []).map(el => {
      const copyToDoc = createDocument(el).Prop() as DocumentOptions;
      return <MenuItem>{ label: copyToDoc.description, icon: copyToDoc.icon, command: (event) => this.copyTo(el) };
    })];

    this._docSubscription$ = merge(...[this.ds.save$, this.ds.delete$, this.ds.saveCloseDoc$, this.ds.goto$]).pipe(
      filter(doc => doc && doc.type === this.docType))
      .subscribe((doc: DocumentBase) => {
        const exist = (this.dataSource.renderedData).find(d => d.id === doc.id);
        if (exist) {
          this.dataTable.selection = [exist];
          this.dataSource.refresh();
        } else { this.dataSource.goto(doc.id); }
      });

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.docType && data.id === ''))
      .subscribe(data => this.ds.close(null));
  }

  ngAfterViewInit() {
    this.dataSource.dataTable = this.dataTable;

    this.dataTable.multiSortMeta = this.columns
      .map(c => c.sort)
      .filter(e => !!e.order)
      .map(e => <SortMeta>{ field: e.field, order: e.order === 'asc' ? 1 : -1 });

    // обработка команды найти в списке
    const id = this.route.queryParams['value'].goto;
    if (id) {
      setTimeout(() => {
        this.columns.forEach(f => this.dataTable.filters[f.field] = { matchMode: f.filter.center, value: null });
        this.dataSource.goto(id);
        this.router.navigate([this.docType], { replaceUrl: true });
        this.AfterViewInit = true;
      });
      return;
    }
    setTimeout(() => {
      this.columns.forEach(f => this.dataTable.filters[f.field] = { matchMode: f.filter.center, value: f.filter.right });
      this.dataSource.first();
      this.AfterViewInit = true;
    });
  }

  private _update(col: ColumnDef, event, center) {
    if ((event instanceof Array) && event[1]) { event[1].setHours(23, 59, 59, 999); }
    this.dataTable.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.sort(event);
  }
  update = (col: ColumnDef, event, center) => this._debonce.next({ col, event, center });

  sort(event) { if (this.AfterViewInit) { this.dataSource.sort(); } }

  close = () => this.ds.close(null);

  add = () => this.router.navigate([this.selection[0] ? this.selection[0].type : this.dataSource.docType, 'new']);

  copy() { this.router.navigate([this.selection[0].type, 'copy-' + this.selection[0].id]); }

  copyTo(type: DocTypes) { this.router.navigate([type, 'base-' + this.selection[0].id]); }

  open() { this.router.navigate([this.selection[0].type, this.selection[0].id]); }

  delete() { this.selection.forEach(el => this.ds.delete(el.id)); }

  async post(mode = 'post') {
    const tasksCount = this.selection.length; let i = tasksCount;
    for (const s of this.selection) {
      this.lds.counter = Math.round(100 - ((--i) / tasksCount * 100));
      try {
        if (mode === 'post') { await this.ds.post(s.id); } else { await this.ds.unpost(s.id); }
      } catch (err) {
        this.ds.openSnackBar('error', 'Error on post ' + s.description, err.message);
      }
    }
    this.lds.counter = 0;
    this.dataSource.refresh();
  }

  private saveUserSettings() {
    const formListSettings: FormListSettings = {
      filter: (Object.keys(this.dataTable.filters) || [])
        .map(f => (<FormListFilter>{ left: f, center: this.dataTable.filters[f].matchMode, right: this.dataTable.filters[f].value })),
      order: ((<SortMeta[]>this.dataTable.multiSortMeta) || [])
        .map(o => <FormListOrder>{ field: o.field, order: o.order === 1 ? 'asc' : 'desc' })
    };
    this.uss.setFormListSettings(this.docType, formListSettings);
  }

  onContextMenuSelect(event) {
    this.ds.api.getViewModel(this.docType, event.data.id).pipe(take(1))
      .subscribe((data: any) => {
        const model = data.model as DocumentBase;
        let el = (event.originalEvent as MouseEvent).srcElement;
        while (!el.id && el.lastElementChild) { el = el.lastElementChild; }
        this.ctxData = { column: el.id, value: model[el.id] };
      });
  }

  parentChange(event) {
    this.dataTable.filters['parent'] = { matchMode: '=', value: event.data.id };
    this.dataSource.sort();
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._debonce.unsubscribe();
    if (!this.route.queryParams['value'].goto) { this.saveUserSettings(); }
  }

}

import { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTable, MenuItem, SortMeta } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { debounceTime, filter, take, share } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { DocTypes } from '../../../../server/models/documents.types';
import { FormListFilter, FormListOrder, FormListSettings } from '../../../../server/models/user.settings';
import { BaseDocListToolbarComponent } from '../../common/datatable/base.list.toolbar.component';
import { calendarLocale, dateFormat } from '../../primeNG.module';
import { DocumentBase, DocumentOptions } from './../../../../server/models/document';
import { createDocument } from './../../../../server/models/documents.factory';
import { UserSettingsService } from './../../auth/settings/user.settings.service';
import { ApiDataSource } from './../../common/datatable/api.datasource.v2';
import { DocService } from './../../common/doc.service';

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
  @ViewChild('toolbar') toolbar: BaseDocListToolbarComponent;

  private AfterViewInit = false;
  pageSize = 0;
  docType: DocTypes;
  columns: ColumnDef[] = [];
  ctxItems: MenuItem[] = [];
  userButtons: MenuItem[] = [];
  ctxData = { column: '', value: undefined };
  _showTree = false;
  docModel: DocumentBase;

  private _i = 0;
  get i() { return this._i++; }

  constructor(public route: ActivatedRoute, public router: Router, public ds: DocService, public uss: UserSettingsService) {
    this.pageSize = Math.floor((window.innerHeight - 275) / 24);
    this.debonce$.pipe(debounceTime(500)).subscribe(event => this._update(event.col, event.event, event.center));
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

    this.ctxItems = [
      {
        label: 'Quick filter', icon: 'fa-search', command: (event) =>
          this._update(this.columns.find(c => c.field === this.ctxData.column), this.ctxData.value, null)
      },
      { label: 'unPost', icon: 'fa-reply', command: (event) => { this.toolbar.post('unpost'); } },
      { label: 'Delete', icon: 'fa-minus', command: (event) => { this.toolbar.delete(); } },
      ...((this.docModel.Prop() as DocumentOptions).copyTo || []).map(el => {
        const copyToDoc = createDocument(el).Prop() as DocumentOptions;
        return <MenuItem>{ label: copyToDoc.description, icon: copyToDoc.icon, command: (event) => this.toolbar.copyTo(el) };
      })
    ];

    if (this.docModel.isCatalog) {
      this.userButtons = [
        { label: 'tree', icon: 'fa-sitemap', styleClass: 'ui-button-secondary', command: this.showTree.bind(this), visible: true },
       ];
    }

    this._docSubscription$ = Observable.merge(...[this.ds.save$, this.ds.delete$, this.ds.saveCloseDoc$, this.ds.goto$]).pipe(
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
    if (!this.AfterViewInit) { return; }
    if ((event instanceof Array) && event[1]) { event[1].setHours(23, 59, 59, 999); }
    this.dataTable.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.Sort(event);
  }
  update = (col: ColumnDef, event, center) => this._debonce.next({ col, event, center });

  Sort(event) { if (this.AfterViewInit) { this.dataSource.sort(); } }

  showTree() { this._showTree = !this._showTree; }

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

  dragStart(event) {
    console.log('dragStart', event);
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._debonce.unsubscribe();
    if (!this.route.queryParams['value'].goto) { this.saveUserSettings(); }
  }

}

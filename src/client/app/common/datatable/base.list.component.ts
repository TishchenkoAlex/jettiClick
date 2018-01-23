import { AfterViewInit, ChangeDetectorRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/components/common/menuitem';
import { SortMeta } from 'primeng/components/common/sortmeta';
import { DataTable } from 'primeng/components/datatable/datatable';
import { Observable } from 'rxjs/Observable';
import { merge } from 'rxjs/observable/merge';
import { debounceTime, filter, map, share, take } from 'rxjs/operators';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list',
  templateUrl: 'base.list.component.html',
})
export class BaseDocListComponent implements OnInit, OnDestroy, AfterViewInit {

  constructor(public route: ActivatedRoute, public router: Router, public ds: DocService,
    public uss: UserSettingsService, public lds: LoadingService, private cd: ChangeDetectorRef) { }

  locale = calendarLocale; dateFormat = dateFormat;
  private _docSubscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;

  private AfterViewInit = false;
  private _debonce = new Subject<{ col: any, event: any, center: string }>();
  private debonce$ = this._debonce.asObservable().pipe(filter(event => this.AfterViewInit), debounceTime(500))
    .subscribe(event => this._update(event.col, event.event, event.center));

  @Input() pageSize = Math.floor((window.innerHeight - 275) / 24);
  @Input() docType: DocTypes = this.route.params['value'].type;
  @Input() filters: FormListFilter[] = [];

  columns: ColumnDef[] = this.route.data['value'].detail[0] ? this.route.data['value'].detail[0]['columnDef'] : [];
  contexCommands: MenuItem[] = [];
  ctxData = { column: '', value: undefined };
  showTree = false;
  docModel: DocumentBase;
  dataSource: ApiDataSource | null = null;
  data$: Observable<DocumentBase[]>;

  @ViewChild(DataTable) dataTable: DataTable = null;

  async ngOnInit() {
    this._docSubscription$ = merge(...[this.ds.save$, this.ds.delete$, this.ds.saveClose$, this.ds.goto$]).pipe(
      filter(doc => doc && doc.type === this.docType))
      .subscribe(doc => {
        const exist = (this.dataSource.renderedData).find(d => d.id === doc.id);
        if (exist) {
          this.dataTable.selection = [exist];
          this.dataSource.refresh();
        } else { this.dataSource.goto(doc.id); }
      });

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.docType && data.id === ''))
      .subscribe(data => this.close());

    this.docModel = createDocument(this.docType);
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize);

    this.data$ = this.dataSource.result$.pipe(share());
    if (!this.columns.length) {
      this.columns = await this.ds.api.getView(this.docType).pipe(map(r => r.columnDef)).toPromise();
    }

    const exclCol = this.docModel.isDoc ? ['description'] : ['date', 'company'];
    this.columns.forEach(c => { if (exclCol.indexOf(c.field) > -1 || c.hidden) { c.style['display'] = 'none'; } });
    this.columns = this.columns.filter(c => c.style['display'] !== 'none' || c.field === 'Group');
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.dataSource.dataTable = this.dataTable;
      this.dataTable.multiSortMeta = this.columns
        .map(c => c.sort)
        .filter(e => !!e.order)
        .map(e => <SortMeta>{ field: e.field, order: e.order === 'asc' ? 1 : -1 });

      if (this.filters.length) {
        this.filters.filter(f => f.right).forEach(f => this.dataTable.filters[f.left] = { matchMode: f.center, value: f.right });
      }

      this.contexCommands = [{
        label: 'Quick filter', icon: 'fa-search', command: (event) =>
          this._update(this.columns.find(c => c.field === this.ctxData.column), this.ctxData.value, null)
      },
      ...((this.docModel.Prop() as DocumentOptions).copyTo || []).map(el => {
        const copyToDoc = createDocument(el).Prop() as DocumentOptions;
        return <MenuItem>{ label: copyToDoc.description, icon: copyToDoc.icon, command: (event) => this.copyTo(el) };
      })];

      // обработка команды найти в списке
      const id = this.route.queryParams['value'].goto;
      if (id) {
        if (!this.filters.length) {
          this.columns.forEach(f => this.dataTable.filters[f.field] = { matchMode: f.filter.center, value: null });
        }
        this.dataSource.goto(id);
        this.router.navigate([this.docType], { replaceUrl: true });
      } else {
        if (!this.filters.length) {
          this.columns.forEach(f => this.dataTable.filters[f.field] = { matchMode: f.filter.center, value: f.filter.right });
        }
        this.dataSource.first();
      }
      this.AfterViewInit = true; this.cd.detectChanges();
    });
  }

  private _update(col: ColumnDef, event, center) {
    if ((event instanceof Array) && event[1]) { event[1].setHours(23, 59, 59, 999); }
    this.dataTable.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.sort(event);
  }
  update(col: ColumnDef, event, center = 'like') {
    if (!event || (event && !event.value)) { event = null; }
    this._debonce.next({ col, event, center });
  }

  sort(event) { if (this.AfterViewInit) { this.dataSource.sort(); } }

  close() { this.ds.close$.next(<any>{id: '', type: this.docType, close: true}); }

  add() { this.router.navigate([this.dataTable.selection[0] ? this.dataTable.selection[0].type : this.dataSource.docType, 'new']); }

  copy() { this.router.navigate([this.dataTable.selection[0].type, 'copy-' + this.dataTable.selection[0].id]); }

  copyTo(type: DocTypes) { this.router.navigate([type, 'base-' + this.dataTable.selection[0].id]); }

  open() { this.router.navigate([this.dataTable.selection[0].type, this.dataTable.selection[0].id]); }

  delete() { this.dataTable.selection.forEach(el => this.ds.delete(el.id)); }

  async post(mode = 'post') {
    const tasksCount = this.dataTable.selection.length; let i = tasksCount;
    for (const s of this.dataTable.selection) {
      this.lds.counter = Math.round(100 - ((--i) / tasksCount * 100));
      if (mode === 'post') { await this.ds.post(s.id); } else { await this.ds.unpost(s.id); }
    }
    this.lds.counter = 0;
    this.dataSource.refresh();
  }

  parentChange(event) {
    this.dataTable.filters['parent'] = { matchMode: '=', value: event && event.data ? event.data.id : null};
    this.dataSource.sort();
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

  private saveUserSettings() {
    const formListSettings: FormListSettings = {
      filter: (Object.keys(this.dataTable.filters) || [])
        .map(f => (<FormListFilter>{ left: f, center: this.dataTable.filters[f].matchMode, right: this.dataTable.filters[f].value })),
      order: ((<SortMeta[]>this.dataTable.multiSortMeta) || [])
        .map(o => <FormListOrder>{ field: o.field, order: o.order === 1 ? 'asc' : 'desc' })
    };
    this.uss.setFormListSettings(this.docType, formListSettings);
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._debonce.unsubscribe();
    if (!this.route.queryParams['value'].goto && !this.filters.length) { this.saveUserSettings(); }
  }

}

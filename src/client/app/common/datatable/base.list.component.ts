import { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/components/common/messageservice';
import { DataTable, SortMeta } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { FormListFilter, FormListOrder, FormListSettings } from '../../../../server/models/user.settings';
import { DocModel, IDocBase } from '../../../../server/modules/doc.base';
import { dateReviver } from '../../common/utils';
import { SideNavService } from '../../services/side-nav.service';
import { UserSettingsService } from './../../auth/settings/user.settings.service';
import { ApiDataSource } from './../../common/datatable/api.datasource.v2';
import { DocService } from './../../common/doc.service';
import { LoadingService } from './../../common/loading.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list',
  templateUrl: 'base.list.component.html',
})
export class BaseListComponent implements OnInit, OnDestroy, AfterViewInit {

  private _docSubscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _sideNavService$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null = null;

  @Input() actionTepmlate: TemplateRef<any>;
  @Input() pageSize = 25;

  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;
  @ViewChild(DataTable) dataTable: DataTable = null;

  docType = ''; AfterViewInit = false;
  isDoc: boolean;
  columns: ColumnDef[] = [];
  selectedRows: IDocBase[] = [];

  constructor(public route: ActivatedRoute, public router: Router, public ds: DocService, private messageService: MessageService,
    private sns: SideNavService, public uss: UserSettingsService, private lds: LoadingService) {
      this.pageSize = Math.floor((window.innerHeight - 275) / 24);
  };

  ngOnInit() {
    this.docType = this.route.params['value'].type;
    const view = this.route.data['value'].detail[0]['view'];
    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');

    this.columns = JSON.parse(JSON.stringify(this.route.data['value'].detail[0]['columnDef']), dateReviver);
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize);

    const excludeColumns = this.isDoc ? ['description'] : ['date'];
    this.columns.filter(c => excludeColumns.indexOf(c.field) > -1).forEach(c => c.hidden = true);
    this.columns = this.columns.filter(c => !!!c.hidden);

    this._docSubscription$ = Observable.merge(...[this.ds.save$, this.ds.delete$, this.ds.saveCloseDoc$, this.ds.goto$]).pipe(
      filter(doc => doc && doc.type === this.docType))
      .subscribe((doc: IDocBase) => {
        const exist = (this.dataSource.renderedData).find(d => d.id === doc.id);
        if (exist) {
          this.dataTable.selection = [exist];
          this.dataSource.refresh();
        } else {this.dataSource.goto(doc.id) }
      });

    this._sideNavService$ = this.sns.do$.pipe(
      filter(data => data.type === this.docType && data.id === ''))
      .subscribe(data => this.sns.templateRef = this.sideNavTepmlate);

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.docType && data.id === ''))
      .subscribe(data => this.ds.close(null));
  }

  ngAfterViewInit() {
    this.dataSource.dataTable = this.dataTable;

    if (this.route.queryParams['value'].goto) {
      this.ds.goto(new DocModel(this.docType, this.route.queryParams['value'].goto));
      this.router.navigate([this.docType], {replaceUrl: true});
      return;
    }

    this.dataTable.multiSortMeta = this.columns
      .map(c => c.sort)
      .filter(e => !!e.order)
      .map(e => <SortMeta>{ field: e.field, order: e.order === 'asc' ? 1 : -1 });

    setTimeout(() => {
      this.columns.forEach(f => this.dataTable.filters[f.field] = { matchMode: f.filter.center, value: f.filter.right });
      this.dataSource.first();
      this.AfterViewInit = true;
    });
  }

  update(col: ColumnDef, event, center) {
    this.dataTable.filters[col.field] = { matchMode: center || col.filter.center, value: event };
    this.Sort(event);
  }

  Sort(event) {
    if (this.AfterViewInit) { this.dataSource.sort() }
  }

  Close() {
    this.ds.close(null);
  }

  private saveUserSettings() {
    const formListSettings: FormListSettings = {
      filter: (Object.keys(this.dataTable.filters) || [])
        .map(f => (<FormListFilter>{ left: f, center: this.dataTable.filters[f].matchMode, right: this.dataTable.filters[f].value })),
      order: ((<SortMeta[]>this.dataTable.multiSortMeta) || [])
        .map(e => <FormListOrder>{ field: e.field, order: e.order === 1 ? 'asc' : 'desc' })
    };
    this.uss.setFormListSettings(this.docType, formListSettings);
  }

  add() {
    this.router.navigate([this.dataSource.dataTable.selection[0] ?
      this.dataSource.dataTable.selection[0].type : this.docType, 'new']);
  }

  copy() { this.router.navigate([this.dataSource.dataTable.selection[0].type, 'copy-' + this.dataSource.dataTable.selection[0].id]) }

  open() { this.router.navigate([this.dataSource.dataTable.selection[0].type, this.dataSource.dataTable.selection[0].id]) }

  delete() { this.dataSource.dataTable.selection.forEach(el => this.ds.delete(el.id)) }

  async post() {
    const tasksCount = this.dataSource.dataTable.selection.length; let i = tasksCount;
    for (const s of this.dataSource.dataTable.selection) {
      this.lds.counter = Math.round(100 - ((--i) / tasksCount * 100));
      try {
        await this.ds.post(s.id);
      } catch (err) {
        this.messageService.add({ severity: 'error', summary: 'Error on post ' + s.description, detail: err.error })
      }
    }
    this.lds.counter = 0;
    this.dataSource.refresh();
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._sideNavService$.unsubscribe();
    if (!this.route.queryParams['value'].goto) { this.saveUserSettings() };
  }

}

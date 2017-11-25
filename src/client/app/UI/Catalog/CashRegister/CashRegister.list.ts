import { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTable } from 'primeng/primeng';
import { SortMeta } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../../server/models/column';
import { FormListOrder, FormListSettings } from '../../../../../server/models/user.settings';
import { DocModel } from '../../../../../server/modules/doc.base';
import { SideNavService } from '../../../services/side-nav.service';
import { UserSettingsService } from './../../../auth/settings/user.settings.service';
import { ApiDataSource } from './../../../common/datatable/api.datasource.v2';
import { DocService } from './../../../common/doc.service';
import { LoadingService } from './../../../common/loading.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'CashRegister.list.html',
  styleUrls: ['CashRegister.list.scss']
})
export class CashRegisterListComponent implements OnInit, OnDestroy, AfterViewInit {
  private _docSubscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _sideNavService$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null = null;

  @Input() actionTepmlate: TemplateRef<any>;
  @Input() pageSize = 25;

  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;
  @ViewChild(DataTable) dataTable: DataTable;

  isDoc: boolean;
  docType = '';
  columns: ColumnDef[] = [];
  selectedRows: DocModel[] = [];

  constructor(public route: ActivatedRoute, public router: Router,
    public ds: DocService, private sns: SideNavService,
    public uss: UserSettingsService, private lds: LoadingService) {
    if (this.uss.userSettings.defaults.rowsInList) { this.pageSize = this.uss.userSettings.defaults.rowsInList }
  };

  ngOnInit() {
    this.docType = this.route.params['value'].type;
    const view = this.route.data['value'].detail[0]['view'];
    this.columns = this.route.data['value'].detail[0]['columnDef'];

    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize);

    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');

    const excludeColumns = this.isDoc ? 'description' : 'date';
    const col = this.columns.find(c => c.field === excludeColumns);
    if (col) { col.hidden = true }

    this.columns = this.columns.filter(c => !!!c.hidden);

    this._docSubscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$,
      this.ds.saveCloseDoc$,
      this.ds.goto$]).pipe(
      filter(doc => doc && doc.type === this.docType))
      .subscribe(doc => this.dataSource.goto(doc.id));

    this._sideNavService$ = this.sns.do$.pipe(
      filter(data => data.type === this.docType && data.id === ''))
      .subscribe(data => this.sns.templateRef = this.sideNavTepmlate);

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
    this.dataSource.first();
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._sideNavService$.unsubscribe();
  }

  close() {
    this.ds.close(null);
  }

  Sort(event) {
    this.dataSource.sort();
    const formListSettings: FormListSettings = {
      filter: this.columns.map(c => c.filter),
      order: (<SortMeta[]>this.dataTable.multiSortMeta)
        .map(e => <FormListOrder>{ field: e.field, order: e.order === 1 ? 'asc' : 'desc' })
    }
    this.uss.setFormListSettings(this.docType, formListSettings);
  }

  add() {
    this.router.navigate([this.dataSource.dataTable.selection[0].type, 'new']);
  }

  copy() {
    this.router.navigate([this.dataSource.dataTable.selection[0].type, 'copy-' + this.dataSource.dataTable.selection[0].id]);
  }

  open() {
    this.router.navigate([this.dataSource.dataTable.selection[0].type, this.dataSource.dataTable.selection[0].id])
  }

  delete() {
    this.dataSource.dataTable.selection.forEach(el => this.ds.delete(el.id));
  }

  async post() {
    const tasksCount = this.dataSource.dataTable.selection.length; let i = tasksCount;
    for (const s of this.dataSource.dataTable.selection) {
      await this.ds.post(s.id);
      this.lds.counter = 100 - (--i) / tasksCount * 100;
    }
    this.lds.counter = 0;
    this.dataSource.refresh();
  }
}


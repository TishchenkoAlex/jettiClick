import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { FormListSettings } from '../../../../server/models/user.settings';
import { DocModel } from '../../../../server/modules/doc.base';
import { UserSettingsService } from '../../auth/settings/user.settings.service';
import { DocService } from '../doc.service';
import { LoadingService } from '../loading.service';
import { SideNavService } from './../../services/side-nav.service';
import { ApiDataSource } from './api.datasource';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list',
  styleUrls: ['./base.list.component.scss'],
  templateUrl: './base.list.component.html',
  providers: []
})
export class BaseListComponent implements OnInit, AfterViewInit, OnDestroy {

  private _docSubscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _sideNavService$: Subscription = Subscription.EMPTY;
  private _sortChange$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null;

  @Input() actionTepmlate: TemplateRef<any>;
  @Input() pageSize = 14;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  isDoc: boolean;
  docType = '';
  columns: ColumnDef[] = [];
  displayedColumns = [];

  constructor(public route: ActivatedRoute, public router: Router, public cd: ChangeDetectorRef,
    public ds: DocService, private sns: SideNavService,
    public uss: UserSettingsService, private lds: LoadingService) {
    this.pageSize = this.uss.userSettings.defaults.rowsInList;
  };

  ngOnInit() {
    this.docType = this.route.params['value'].type;
    const view = this.route.data['value'].detail[0]['view'];
    this.columns = this.route.data['value'].detail[0]['columnDef'];

    const _sort = this.columns.map(c => c.sort).find(s => s.order !== '');
    if (_sort) {
      this.sort.direction = _sort.order;
      this.sort.active = _sort.field;
    }

    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize, this.uss, this.sort);

    this.displayedColumns = this.columns.filter(c =>
      !c.hidden && (this.isDoc ? c.field !== 'description' : (c.field !== 'company') && (c.field !== 'date')))
      .map(c => c.field);
    this.displayedColumns.unshift('select', 'posted');

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
    const formListSettings: FormListSettings = {
      filter: this.columns.map(c => c.filter),
      order: this.columns.map(c => c.sort)
    }
    this.uss.userSettings.formListSettings[this.docType] = formListSettings;

    this._sortChange$ = this.sort.sortChange.subscribe(() => {
      formListSettings.order = [{ field: this.sort.active, order: this.sort.direction }];
      this.uss.setFormListSettings(this.docType, formListSettings);
    });

    this.uss.formListSettings$.next({ type: this.docType, payload: formListSettings });
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._sideNavService$.unsubscribe();
    this._sortChange$.unsubscribe();
  }

  add() {
    if (this.dataSource.selection.selected.length === 1) {
      const index = this.dataSource.renderedData.findIndex(s => s.id === this.dataSource.selection.selected[0]);
      this.router.navigate([this.dataSource.renderedData[index]['type'], 'new']);
      return;
    }
    if (this.docType.startsWith('Document.') || this.docType.startsWith('Catalog.')) {
      this.router.navigate([this.docType, 'new']);
    }
  }

  copy() {
    this.router.navigate([this.docType, 'copy-' + this.dataSource.selection.selected[0]])
    this.dataSource.selection.clear();
  }

  open(row: DocModel) {
    this.router.navigate([row.type, row.id])
  }

  delete() {
    this.dataSource.selection.selected.forEach(el => this.ds.delete(el));
  }

  async post() {
    const tasksCount = this.dataSource.selection.selected.length;
    const selected = this.dataSource.selection.selected.filter(el => this.dataSource.renderedData.findIndex(d => d.id === el) > -1);
    for (const s of selected) {
      await this.ds.post(s);
      this.dataSource.selection.deselect(s);
      this.lds.counter = 100 - (this.dataSource.selection.selected.length) / tasksCount * 100;
      if (this.dataSource.selection.selected.length === 0) {
        this.lds.counter = 0;
        this.dataSource.refresh();
      }
      this.cd.markForCheck();
    }
  }

  close() {
    this.ds.close(null);
  }

}


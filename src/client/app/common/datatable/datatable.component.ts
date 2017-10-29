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
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { FormListSettings } from '../../../../server/models/user.settings';
import { DocModel } from '../../../../server/modules/doc.base';
import { UserSettingsService } from '../../auth/settings/user.settings.service';
import { DocService } from '../doc.service';
import { SideNavService } from './../../services/side-nav.service';
import { ApiDataSource } from './api.datasource';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.scss'],
  templateUrl: './datatable.component.html',
})
export class CommonDataTableComponent implements OnInit, AfterViewInit, OnDestroy {

  private _docSubscription$: Subscription = Subscription.EMPTY;
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

  constructor(private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef,
    private ds: DocService, private sns: SideNavService, private uss: UserSettingsService) {
    this.pageSize = this.uss.userSettings.defaults.rowsInList;
  };

  ngOnInit() {
    const view = this.route.data['value'].detail[0]['view'];
    this.columns = this.route.data['value'].detail[0]['columnDef'];


    this.docType = this.route.params['value'].type;
    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize, this.uss);
    if (this.isDoc) { this.sort.active = 'date'; } else { this.sort.active = 'description'; }

    this.displayedColumns = this.columns.filter(c =>
      !c.hidden && (this.isDoc ? c.field !== 'description' : (c.field !== 'company') && (c.field !== 'date')))
      .map(c => c.field);
    this.displayedColumns.unshift('select');

    this._docSubscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$,
      this.ds.goto$])
      .filter(doc => doc && doc.type === this.docType)
      .subscribe(doc => this.dataSource.goto(doc.id));

    this._sideNavService$ = this.sns.do$
      .filter(data => data.type === this.docType && data.id === '')
      .subscribe(data => this.sns.templateRef = this.sideNavTepmlate);
  }

  ngAfterViewInit() {
    const formListSettings: FormListSettings = {
      filter: this.columns.map(c => c.filter),
      order: this.columns.map(c => c.sort)
    }
    const sort = formListSettings.order.find(s => s.order !== '');
    if (sort) {
      console.log('SORT CHANGE', sort);
      this.sort.direction = sort.order;
      this.sort.active = sort.field;
      this.cd.detectChanges();
    }

    this._sortChange$ = this.sort.sortChange.subscribe(() => {
      formListSettings.order = [{field: this.sort.active, order: this.sort.direction }];
      this.uss.setFormListSettings(this.docType, formListSettings);
    });

    this.uss.formListSettings$.next({ type: this.docType, payload: formListSettings });
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
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

  post() {
    const tasks$ = [];
    this.dataSource.selection.selected
      .filter(el => this.dataSource.renderedData.findIndex(d => d.id === el) > -1)
      .forEach(el => tasks$.push(this.ds.post(el).take(1)));
    Observable.forkJoin(...tasks$)
      .take(1)
      .subscribe(results => {
        this.dataSource.refresh();
        this.ds.openSnackBar('Multiple parallel tasks', 'complete')
      });
  }

  close() {
    const doc = new DocModel(this.docType, '');
    doc.type = this.docType;
    this.ds.close(doc);
  }

}


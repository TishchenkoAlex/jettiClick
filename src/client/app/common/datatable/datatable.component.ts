import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { UserSettingsService } from '../../auth/settings/user.settings.service';
import { DocModel } from '../../common/doc.model';
import { DocService } from '../doc.service';
import { ColDef } from '../filter-column/column';
import { FilterObject } from '../filter/filter.control.component';
import { SideNavService } from './../../services/side-nav.service';
import { ApiDataSource } from './api.datasource';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.scss'],
  templateUrl: './datatable.component.html',
})
export class CommonDataTableComponent implements OnInit, OnDestroy {

  protected _docSubscription$: Subscription = Subscription.EMPTY;
  protected _sideNavService$: Subscription = Subscription.EMPTY;
  protected _userSettingscSubscription$: Subscription = Subscription.EMPTY;

  dataSource: ApiDataSource | null;

  @Input() actionTepmlate: TemplateRef<any>;
  @Input() pageSize = 14;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  isDoc: boolean;
  docType = '';
  columns: ColDef[] = [];
  displayedColumns = [];
  filterColumns: any[] = [];

  constructor(private route: ActivatedRoute, private router: Router,
    private ds: DocService, private sns: SideNavService, private uss: UserSettingsService) { };

  ngOnInit() {
    const view = this.route.data['value'].detail;
    this.docType = this.route.params['value'].type;
    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');
    if (this.isDoc) { this.sort.active = 'date'; } else { this.sort.active = 'description'; }
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.pageSize, this.sort);

    Object.keys(view).filter(property => view[property] && view[property]['type'] !== 'table').map((property) => {
      const prop = view[property];
      const hidden = !!prop['hidden-list'];
      const order = hidden ? 1000 : prop['order'] * 1 || 999;
      const label = (prop['label'] || property.toString()).toLowerCase();
      const type = prop['type'] || 'string';
      const style = prop['style'] || '';
      this.columns.push({ field: property, type: type, label: label, hidden: hidden, order: order, style: style });
    });
    this.columns.sort((a, b) => a.order - b.order);

    this.displayedColumns = this.columns.filter(c =>
      !c.hidden && (this.isDoc ? c.field !== 'description' : (c.field !== 'company') && (c.field !== 'date')))
      .map(c => c.field);
    this.displayedColumns.unshift('select');
    this.filterColumns = this.columns.filter(c => !c.hidden).map(c => ({ key: c.field, value: c.label }));

    this._docSubscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$,
      this.ds.goto$])
      .filter(doc => doc && doc.type === this.docType)
      .subscribe(doc => this.dataSource.goto(doc.id));

    this._sideNavService$ = this.sns.do$
      .filter(data => data.type === this.docType && data.id === '')
      .subscribe(data => this.sns.templateRef = this.sideNavTepmlate);

    this._userSettingscSubscription$ = this.uss.formListSettings$.skip(1)
      .filter(s => s.type === this.docType).subscribe(s => {
        console.log('USS', s.payload);
        this.dataSource.filterObject = { action: 'filter', value: {} };
      })
    this.uss.get(this.docType);
  }

  ngOnDestroy() {
    this._docSubscription$.unsubscribe();
    this._sideNavService$.unsubscribe();
    this.dataSource._filterObjectChangeSubscription.unsubscribe();
    this._userSettingscSubscription$.unsubscribe();
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

  onChangeFilter(event: FilterObject) {
    this.dataSource.filterObject = event;
    console.log('onChangeFilter', event);
  }
}


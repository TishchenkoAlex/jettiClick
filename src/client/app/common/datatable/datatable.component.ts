import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MdPaginator, MdSort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { DocModel, JETTI_DOC_PROP } from '../../common/doc.model';
import { DocumentComponent } from '../../common/dynamic-component/dynamic-component';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { SideNavService } from './../../services/side-nav.service';

export interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: string };
export interface FilterObject { startDate: Date, endDate: Date, columnFilter: string };

@Component({
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.scss'],
  templateUrl: './datatable.component.html',
})
export class CommonDataTableComponent implements DocumentComponent, OnInit, OnDestroy {

  protected _subscription$: Subscription = Subscription.EMPTY;
  protected _filter$: Subscription = Subscription.EMPTY;
  protected _sideNavService$: Subscription = Subscription.EMPTY;

  selection = new SelectionModel<DocModel>(true, []);
  dataSource: ApiDataSource | null;

  @Input() data;
  @Input() actionTepmlate: TemplateRef<any>;

  private _filterObject: FilterObject;
  @Input() set filterObject(value: FilterObject) {
    this._filterObject = value;
    if (!this.dataSource) { return; }
    this.dataSource.filterObjext = value;
  };
  get filterObject(): FilterObject {
    return this._filterObject;
  };

  private _selectedPeriod = '';
  get selectedPeriod() { return this._selectedPeriod; }
  set selectedPeriod(value) {
    const columnFilter = this.filter.nativeElement.value;
    if (!this.dataSource) { return; }
    switch (value) {
      case 'td': {
        this.filterObject = {
          startDate: moment().startOf('day').toDate(),
          endDate: moment().endOf('day').toDate(), columnFilter: columnFilter
        };
        break;
      }
      case '7d': {
        this.filterObject = { startDate: moment().add(-7, 'day').toDate(), endDate: new Date(), columnFilter: columnFilter };
        break;
      }
      case 'tw': {
        this.filterObject = { startDate: moment().startOf('week').toDate(), endDate: new Date(), columnFilter: columnFilter };
        break;
      }
      case 'lw': {
        this.filterObject = {
          startDate: moment().startOf('week').add(-1, 'week').toDate(),
          endDate: moment().endOf('week').add(-1, 'week').toDate(), columnFilter: columnFilter
        };
        break;
      }
      case 'tm': {
        this.filterObject = { startDate: moment().startOf('month').toDate(), endDate: new Date(), columnFilter: columnFilter };
        break;
      }
      case 'lm': {
        this.filterObject = {
          startDate: moment().startOf('month').add(-1, 'month').toDate(),
          endDate: new Date(), columnFilter: columnFilter
        };
        break;
      }
      case 'ty': {
        this.filterObject = { startDate: moment().startOf('year').toDate(), endDate: new Date(), columnFilter: columnFilter };
        break;
      }
      case 'ly': {
        this.filterObject = {
          startDate: moment().startOf('year').add(-1, 'year').toDate(),
          endDate: moment().endOf('year').add(-1, 'year').toDate(), columnFilter: columnFilter
        };
        break;
      }
      default: {
        this.filterObject = { startDate: moment().startOf('week').toDate(), endDate: new Date(), columnFilter: columnFilter };
      }
    }
    this._selectedPeriod = value;
  }

  columns: ColDef[] = [];
  displayedColumns = [];

  private _selectedColumn = 'code';
  set selectedColumn(value) {
    this._selectedColumn = value;
    if (!this.dataSource) { return; }
    this.filter.nativeElement.value = '';
    this.dataSource.selectedColumn = this.selectedColumn;
    this.dataSource.filterObjext = {
      startDate: this.filterObject.startDate,
      endDate: this.filterObject.endDate,
      columnFilter: this.filter.nativeElement.value
    };
  };
  get selectedColumn() { return this._selectedColumn; }

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  get isDoc(): boolean { return this.data.docType.startsWith('Document.') || this.data.docType.startsWith('Journal.') }

  constructor(private route: ActivatedRoute, private router: Router,
    private ds: DocService, private sideNavService: SideNavService) { };

  ngOnInit() {

    this.dataSource = new ApiDataSource(this.ds.api, this.data.docType, this.data.pageSize, this.paginator, this.sort);

    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(1000)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filterObjext = {
          startDate: this.filterObject.startDate,
          endDate: this.filterObject.endDate,
          columnFilter: this.filter.nativeElement.value
        };
      });

    const view = (this.route.data['value'].detail);
    Object.keys(view).map((property) => {
      if (JETTI_DOC_PROP.indexOf(property) > -1 || (view[property] && view[property]['type'] === 'table')) { return; }
      const prop = view[property];
      const order = prop['order'] * 1 || 99;
      const hidden = prop['hidden'] === 'true';
      const label = (prop['label'] || property.toString()).toLowerCase();
      const dataType = prop['type'] || 'string';
      const style = prop['style'] || '';
      this.columns.push({ field: property, type: dataType, label: label, hidden: hidden, order: order, style: style });
    });
    this.columns.sort((a, b) => a.order - b.order);
    this.displayedColumns = this.columns.map((c) => c.field);
    if (this.data.docType.startsWith('Document.')) {
      this.displayedColumns.unshift('select', 'posted', 'date', 'code');
    } else {
      if (this.data.docType.startsWith('Document.') || this.data.docType.startsWith('Journal.')) {
        this.displayedColumns.unshift('select', 'posted', 'date', 'code');
      } else {
        this.displayedColumns.unshift('select', 'posted', 'code', 'description');
      }
    }
    this.selectedPeriod = 'tm';

    this._subscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$])
      .filter(doc => doc.type === this.data.docType)
      .subscribe(doc => this.refresh());

    this._sideNavService$ = this.sideNavService.do$
      .filter(data => data.type === this.data.docType)
      .subscribe(data => this.sideNavService.templateRef = this.sideNavTepmlate);
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._filter$.unsubscribe();
    this._sideNavService$.unsubscribe();
  }

  onPeriodChange() {
    this.selectedPeriod = Object.assign({}, this.selectedPeriod);
  }

  isAllSelected(): boolean {
    if (!this.dataSource) { return false; }
    if (this.selection.isEmpty()) { return false; }
    return this.selection.selected.length >= this.dataSource.renderedData.length;
  }

  masterToggle() {
    if (!this.dataSource) { return; }
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.renderedData.forEach(data => this.selection.select(data));
    }
  }

  refresh() {
    this.dataSource.Refresh();
    this.selection.clear();
  }

  add() {
    if (this.selection.selected.length === 1) {
      this.router.navigate([this.selection.selected[0].type, 'new']);
      return;
    }
    if (this.data.docType.startsWith('Document.') ||
      this.data.docType.startsWith('Catalog.')) {
      this.router.navigate([this.data.docType, 'new']);
    }
  }

  copy() {
    this.router.navigate([this.selection.selected[0].type, 'copy-' + this.selection.selected[0].id])
  }

  open(row: DocModel) {
    this.router.navigate([row.type, row.id])
  }

  delete() {
    this.selection.selected.forEach(el => {
      this.ds.delete(el.id);
    });
  }

  post() {
    const tasks$ = [];
    this.selection.selected
      .filter(el => !el.deleted)
      .forEach(el => tasks$.push(this.ds.post(el).take(1)));
    Observable.forkJoin(...tasks$)
      .subscribe(results => {
        this.refresh();
        this.ds.openSnackBar('Multiple parallel tasks', 'complete')
      });
  }

  close() {
    console.log('BASE CLOSE');
    this.ds.close(this.data);
  }
}

export class ApiDataSource extends DataSource<any> {
  _doRefresh = new BehaviorSubject('');

  selectedColumn = 'code';

  _filterObjextChange = new BehaviorSubject<FilterObject>(null);
  get filterObjext(): FilterObject { return this._filterObjextChange.value; }
  set filterObjext(filterObjext: FilterObject) { this._filterObjextChange.next(filterObjext); }

  renderedData: any[];
  isLoadingResults = true;
  result$: Observable<any[]>;

  constructor(private apiService: ApiService,
    private docType: string, private pageSize: number,
    private _paginator: MdPaginator,
    private _sort: MdSort) {

    super();

    this._paginator.pageSize = pageSize;
    this._filterObjextChange.subscribe(() => this._paginator.pageIndex = 0);

    this.result$ = Observable.merge(...[
      this._sort.sortChange,
      this._filterObjextChange,
      this._paginator.page,
      this._doRefresh,
    ])
      .distinctUntilChanged()
      .filter(stream => !!stream)
      .switchMap((stream) => {
        this.isLoadingResults = true;
        const filter = !this.filterObjext.columnFilter ? '' :
          ` (d."${this.selectedColumn}" ILIKE '${this.filterObjext.columnFilter}*') `;
        return this.apiService.getDocList(this.docType,
          (this._paginator.pageIndex) * this._paginator.pageSize, this._paginator.pageSize,
          this._sort.active ? '"' + this._sort.active + '" ' + this._sort.direction : '', filter)
          .do(data => {
            this._paginator.length = data.total_count;
            this.renderedData = data.data;
            this.isLoadingResults = false;
          })
          .catch(err => {
            this._paginator.length = 0;
            this.renderedData = [];
            this.isLoadingResults = false;
            return Observable.of();
          });
      })
      .map(data => data['data'])
  }

  connect(): Observable<any[]> {
    return this.result$;
  }

  disconnect() { }

  Refresh() {
    this._doRefresh.next(Math.random().toString());
  }

}

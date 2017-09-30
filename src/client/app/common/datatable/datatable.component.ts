import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { DocModel, JETTI_DOC_PROP } from '../../common/doc.model';
import { ApiService, Continuation } from '../../services/api.service';
import { DocService } from '../doc.service';
import { SideNavService } from './../../services/side-nav.service';

export interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: string };
export interface FilterObject { startDate: Date, endDate: Date, columnFilter: string };

@Component({
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.scss'],
  templateUrl: './datatable.component.html',
})
export class CommonDataTableComponent implements OnInit, OnDestroy {

  protected _subscription$: Subscription = Subscription.EMPTY;
  protected _filter$: Subscription = Subscription.EMPTY;
  protected _sideNavService$: Subscription = Subscription.EMPTY;

  selection = new SelectionModel<DocModel>(true, []);
  dataSource: ApiDataSource | null;

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

  docType = '';
  columns: ColDef[] = [];
  displayedColumns = [];
  filterColumns: any[] = [];

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

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  isDoc: boolean;

  constructor(private route: ActivatedRoute, private router: Router, private ds: DocService, private sns: SideNavService) { };

  ngOnInit() {

    const view = this.route.data['value'].detail;
    this.docType = this.route.params['value'].type;
    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, this.sort, this.selection);

    Object.keys(view).map((property) => {
      if (JETTI_DOC_PROP.filter(e => (e !== 'company'))
        .indexOf(property) > -1 || (view[property] && view[property]['type'] === 'table')) { return; }
      const prop = view[property];
      const hidden = !!prop['hidden-list'];
      const order = hidden ? 1000 : prop['order'] * 1 || 999;
      const label = (prop['label'] || property.toString()).toLowerCase();
      const type = prop['type'] || 'string';
      const style = prop['style'] || '';
      this.columns.push({ field: property, type: type, label: label, hidden: hidden, order: order, style: style });
    });
    this.columns.sort((a, b) => a.order - b.order);
    this.displayedColumns = this.columns.filter(c => !c.hidden && this.isDoc).map((c) => c.field);
    if (this.docType.startsWith('Document.') || this.docType.startsWith('Journal.')) {
      this.displayedColumns.unshift('select', 'posted', 'date', 'code');
    } else {
      this.displayedColumns.unshift('select', 'posted', 'code', 'description');
    }
    this.filterColumns = this.columns.filter(c => !c.hidden).map(c => {
      return { key: c.field, value: c.label };
    });

    this.selectedPeriod = 'tm';

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

    this._subscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$])
      .filter(doc => doc.type === this.docType)
      .subscribe(doc => this.refresh());

    this._sideNavService$ = this.sns.do$
      .filter(data => data.type === this.docType && data.id === '')
      .subscribe(data => this.sns.templateRef = this.sideNavTepmlate);
  }

  ngOnDestroy() {
    console.log('DESTROY', this.docType);
    this._subscription$.unsubscribe();
    this._filter$.unsubscribe();
    this._sideNavService$.unsubscribe();
    this.dataSource._filterObjextChangeSubscription.unsubscribe();
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
    if (this.docType.startsWith('Document.') ||
      this.docType.startsWith('Catalog.')) {
      this.router.navigate([this.docType, 'new']);
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
      .take(1)
      .subscribe(results => {
        this.refresh();
        this.ds.openSnackBar('Multiple parallel tasks', 'complete')
      });
  }

  close() {
    console.log('BASE CLOSE');
    const doc = new DocModel(this.docType, '');
    doc.type = this.docType;
    this.ds.close(doc);
  }

  first() {
    this.dataSource._paginator.next('first');
  }

  last() {
    this.dataSource._paginator.next('last');
  }

  next() {
    this.dataSource._paginator.next('next');
  }

  prev() {
    this.dataSource._paginator.next('prev');
  }
}

export class ApiDataSource extends DataSource<any> {
  _paginator = new BehaviorSubject('');

  selectedColumn = 'code';

  _filterObjextChangeSubscription: Subscription = Subscription.EMPTY;
  _filterObjextChange = new BehaviorSubject<FilterObject>(null);
  get filterObjext(): FilterObject { return this._filterObjextChange.value; }
  set filterObjext(filterObjext: FilterObject) { this._filterObjextChange.next(filterObjext); }

  renderedData: any[];
  startDoc = new DocModel(this._docType, 'first');
  continuation: Continuation = {first: this.startDoc, last: this.startDoc};
  isLoadingResults = true;
  private result$: Observable<any[]>;

  constructor(private apiService: ApiService, private _docType: string,
    private _sort: MatSort, private _selection: SelectionModel<DocModel>) {

    super();

    this._filterObjextChangeSubscription = this._filterObjextChange
      .subscribe();

    this.result$ = Observable.merge(...[
      this._filterObjextChange,
      this._sort.sortChange,
      this._paginator,
    ])
      .filter(stream => !!stream)
      .switchMap((stream) => {
        console.log(stream, this._sort)
        this.isLoadingResults = true;
        const filter = '';
        let continuationID = 'first';
        switch (this._paginator.value) {
          case 'first': continuationID = 'first'; break;
          case 'prev': continuationID = this.continuation.first.id; break;
          case 'next': continuationID = this.continuation.last.id; break;
          case 'last': continuationID = 'last'; break;
          case 'refresh': continuationID = this.renderedData[0].id; break;
          default: continuationID = 'first';
        }
        return this.apiService.getDocList2(this._docType, continuationID, this._paginator.value, 10,
          this.renderedData && this._selection.selected.length ?
            this.renderedData.findIndex(s => s.id === this._selection.selected[0].id) : 1,
          this._sort.active + ' ' + this._sort.direction, filter)
          .do(data => {
            this.renderedData = data.data;
            this.continuation = data.continuation;
            this.isLoadingResults = false;
          })
          .catch(err => {
            this.renderedData = [];
            this.isLoadingResults = false;
            return Observable.of<any[]>([]);
          });
      })
      .map(data => data['data'])
  }

  connect(): Observable<any[]> {
    return this.result$;
  }

  disconnect() { }

  Refresh() {
    this._paginator.next('refresh');
  }

}

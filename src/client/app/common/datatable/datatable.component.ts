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

  selection = new SelectionModel<string>(true, []);
  dataSource: ApiDataSource | null;

  @Input() actionTepmlate: TemplateRef<any>;

  private _filterObject: FilterObject;
  @Input() set filterObject(value: FilterObject) {
    this._filterObject = value;
    if (!this.dataSource) { return; }
    this.dataSource.filterObjext = value;
  };
  get filterObject(): FilterObject { return this._filterObject };

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

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  isDoc: boolean;

  constructor(private route: ActivatedRoute, private router: Router, private ds: DocService, private sns: SideNavService) { };

  ngOnInit() {

    const view = this.route.data['value'].detail;
    this.docType = this.route.params['value'].type;
    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');
    this.sort.direction = 'asc'
    if (this.isDoc) { this.sort.active = 'date'; } else { this.sort.active = 'description'; }
    this.dataSource = new ApiDataSource(this.ds.api, this.docType, 10, this.sort, this.selection);

    Object.keys(view).filter(property => view[property] && view[property]['type'] !== 'table').map((property) => {
      const prop = view[property];
      const hidden = !!prop['hidden-list'] || !!prop['hidden'];
      const order = hidden ? 1000 : prop['order'] * 1 || 999;
      const label = (prop['label'] || property.toString()).toLowerCase();
      const type = prop['type'] || 'string';
      const style = prop['style'] || '';
      this.columns.push({ field: property, type: type, label: label, hidden: hidden, order: order, style: style });
    });
    this.columns.sort((a, b) => a.order - b.order);
    this.displayedColumns = this.columns.filter(c => !c.hidden && (this.isDoc ?
      (c.field !== 'description') :
      (c.field !== 'company') && (c.field !== 'date'))).map((c) => c.field);
    this.displayedColumns.unshift('select');
    this.filterColumns = this.columns.filter(c => !c.hidden).map(c => {
      return { key: c.field, value: c.label }
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
      .subscribe(doc => {
        const offset = this.dataSource.renderedData.findIndex(d => d.id === doc.id) + 1;
        this.refresh();
      });

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
    this.selectedPeriod = this.selectedPeriod;
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
      this.dataSource.renderedData.forEach(data => this.selection.select(data.id));
    }
  }

  refresh() {
    this.dataSource.Refresh();
  }

  add() {
    if (this.selection.selected.length === 1) {
      this.router.navigate([this.docType, 'new']);
      return;
    }
    if (this.docType.startsWith('Document.') ||
      this.docType.startsWith('Catalog.')) {
      this.router.navigate([this.docType, 'new']);
    }
  }

  copy() {
    this.router.navigate([this.docType, 'copy-' + this.selection.selected[0]])
  }

  open(row: DocModel) {
    this.router.navigate([row.type, row.id])
  }

  delete() {
    this.selection.selected.forEach(el => {
      this.ds.delete(el);
    });
  }

  post() {
    const tasks$ = [];
    this.selection.selected
      .filter(el => this.dataSource.renderedData.findIndex(d => d.id === el) > -1)
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
    this.dataSource.paginator.next('first');
  }

  last() {
    this.dataSource.paginator.next('last');
  }

  next() {
    this.dataSource.paginator.next('next');
  }

  prev() {
    this.dataSource.paginator.next('prev');
  }
}

export class ApiDataSource extends DataSource<any> {
  paginator = new BehaviorSubject('');

  selectedColumn = 'code';

  _filterObjextChangeSubscription: Subscription = Subscription.EMPTY;
  _filterObjextChange = new BehaviorSubject<FilterObject>(null);
  get filterObjext(): FilterObject { return this._filterObjextChange.value; }
  set filterObjext(filterObjext: FilterObject) { this._filterObjextChange.next(filterObjext); }

  renderedData: DocModel[] = [];
  private firstDoc = new DocModel(this._docType, 'first');
  private lastDoc = new DocModel(this._docType, 'last');

  private _docID = '';
  set docID(value: string) { this._docID = value; this.paginator.next('goto'); }

  continuation: Continuation = { first: this.firstDoc, last: this.lastDoc };
  isLoadingResults = true;
  private result$: Observable<any[]>;

  constructor(private apiService: ApiService, private _docType: string, private pageSize: number,
    private _sort: MatSort, private _selection: SelectionModel<string>) {
    super();

    this._filterObjextChangeSubscription = this._filterObjextChange
      .subscribe();

    this.result$ = Observable.merge(...[
      this._filterObjextChange,
      this._sort.sortChange,
      this.paginator,
    ])
      .filter(stream => !!stream)
      .switchMap((stream) => {
        console.log('Observable.merge', stream)
        this.isLoadingResults = true;
        let offset = 0;
        let row: DocModel = this.firstDoc;
        if (this._selection.selected.length) {
          offset = this.renderedData.findIndex(s => s.id === this._selection.selected[0]);
          row = this.renderedData[offset];
        }
        switch (stream) {
          case 'first': row = this.firstDoc; this._selection.clear(); break;
          case 'prev':  row = this.continuation.first; this._selection.clear(); break;
          case 'next': row = this.continuation.last; this._selection.clear(); break;
          case 'last': row = this.lastDoc; this._selection.clear(); break;
          case 'refresh': row = this.renderedData[offset]; break;
          case 'goto': row = new DocModel(this._docType, this._docID); break;
        }
        let sort = '';
        let command = this.paginator.value || 'first';
        if (this._sort.active) {
          if (stream['active']) {
            if (row === this.firstDoc) {
              command = 'first';
            } else {
              command = 'sort';
            }
          }
          sort = this._sort.active + '*' + this._sort.direction + '*' + row[this._sort.active] || '0';
        }
        const filter = '';
        return this.apiService.getDocList2(this._docType, row.id, command, this.pageSize, offset, sort, filter)
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
    this.paginator.next('refresh');
  }

}

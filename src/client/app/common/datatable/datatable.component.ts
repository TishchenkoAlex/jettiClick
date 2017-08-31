import { Component, ElementRef, ViewChild, OnInit, Input, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, SelectionModel, MdDialog } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiService } from '../../services/api.service';
import { DialogComponent } from './../../dialog/dialog.component';
import { DocumentComponent } from '../dynamic-component/document.component';

interface ColDef {
  field: string;
  type: string;
  label: string;
  hidden: boolean;
  order: number;
  style: string;
};

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.scss'],
  templateUrl: './datatable.component.html',
})
export class CommonDataTableComponent implements DocumentComponent, OnInit {

  displayedColumns = [];
  selection = new SelectionModel<string>(true, []);
  dataSource: ApiDataSource | null;

  @Input() data;
  totalRecords = 0;
  columns: ColDef[] = [];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private apiService: ApiService, private dialog: MdDialog, private router: Router) { };

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.data.pageSize, this.paginator, this.sort);

    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(300)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    this.apiService.getView(this.data.docType)
      .subscribe(view => {
        Object.keys(view).map((property) => {
          // tslint:disable-next-line:curly
          if (['id', 'date', 'code', 'description', 'type', 'posted', 'deleted', 'isfolder', 'parent'].indexOf(property) > -1
            || (view[property].constructor === Array)) return;
          const prop = view[property];
          const order = prop['order'] * 1 || 99;
          const hidden = prop['hidden'] === 'true';
          const label = prop['label'] || property.toString();
          const dataType = prop['type'] || 'string';
          this.columns.push({ field: property, type: dataType, label: label, hidden: hidden, order: order, style: null });
        });
        this.columns.sort((a, b) => a.order - b.order);
        this.displayedColumns = this.columns.map((c) => c.field);
        if (this.data.docType.startsWith('Document')) {
          this.displayedColumns.unshift('select', 'posted', 'date', 'code', 'description');
        } else {
          this.displayedColumns.unshift('select', 'posted', 'code', 'description');
        }
      });
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

  Refresh() {
    this.dataSource.Refresh();
  }

  openDialog(row) {
    this.dialog.open(DialogComponent, { data: Object.assign({}, row) }).afterClosed()
      .filter(result => !!result)
      .subscribe(data => {
        Object.assign(row, data);
      });

  }

  addDoc() {
    this.router.navigate([this.data.docType, 'new'])
  }

  openDoc(row) {
    this.router.navigate([this.data.docType, row.id])
  }
}

export class ApiDataSource extends DataSource<any> {
  _doRefresh = new BehaviorSubject('');

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  renderedData: any[];
  isLoadingResults = true;
  result$: Observable<any[]>;

  constructor(private apiService: ApiService,
    private docType: string, private pageSize: number,
    private _paginator: MdPaginator,
    private _sort: MdSort) {

    super();

    this._paginator.pageSize = pageSize;
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);

    this.result$ = Observable.merge(...[
      this._sort.mdSortChange,
      this._filterChange,
      this._paginator.page,
      this._doRefresh,
    ])
      .distinctUntilChanged()
      .switchMap((stream) => {
        this.isLoadingResults = true;
        // tslint:disable-next-line:max-line-length
        const filter = this._filterChange.value ? `(d.description ILIKE '${this._filterChange.value}*' OR d.code ILIKE '${this._filterChange.value}*')` : '';
        return this.apiService.getDocList(this.docType,
          (this._paginator.pageIndex) * this._paginator.pageSize, this._paginator.pageSize,
          this._sort.active ? '"' + this._sort.active + '" ' + this._sort.direction : '', filter)
          .do(data => {
                this._paginator.length = data['total_count'];
                this.renderedData = data['data'];
                this.isLoadingResults = false;
              });
          })
          .map(data => data['data'])
          .catch(err => {
            return Observable.of<any[]>([]);
          });
  }

  connect(): Observable<any[]> {
    return this.result$;
  }

  disconnect() { }

  Refresh() {
    this._doRefresh.next(Math.random().toString());
  }
}

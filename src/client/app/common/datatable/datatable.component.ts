import { DataSource } from '@angular/cdk/table';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MdPaginator, MdSort, SelectionModel } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { DocumentComponent } from '../../common/dynamic-component/dynamic-component';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: string };

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

  constructor(private route: ActivatedRoute, private router: Router, private ds: DocService) { };

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.ds.api, this.data.docType, this.data.pageSize, this.paginator, this.sort);

    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(300)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    const view = (this.route.data['value'].detail);
    Object.keys(view).map((property) => {
      // tslint:disable-next-line:curly
      if (['id', 'date', 'code', 'description', 'type', 'posted', 'deleted', 'isfolder', 'parent'].indexOf(property) > -1
        || (view[property].constructor === Array)) return;
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
    if (this.data.docType.startsWith('Document')) {
      this.displayedColumns.unshift('select', 'posted', 'date', 'code', 'description');
    } else {
      this.displayedColumns.unshift('select', 'posted', 'code', 'description');
    }

    this.ds.delete$
      .filter(doc => doc.type === this.data.docType)
      .subscribe(doc => {
        this.Refresh();
      });

    this.ds.save$
    .filter(doc => doc.type === this.data.docType)
    .subscribe(doc => {
      this.Refresh();
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

  addDoc() {
    this.router.navigate([this.data.docType, 'new'])
  }

  openDoc(row) {
    this.router.navigate([this.data.docType, row.id])
  }

  Delete() {
    this.selection.selected.forEach(element => {
      this.ds.delete(element);
    });
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
        const filter = !this._filterChange.value ? '' :
          `(d.description ILIKE '${this._filterChange.value}*' OR d.code ILIKE '${this._filterChange.value}*')`;
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

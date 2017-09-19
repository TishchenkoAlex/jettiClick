import { SelectionModel, DataSource } from '@angular/cdk/collections';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MD_DIALOG_DATA, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../services/api.service';

@Component({
  templateUrl: './suggest.dialog.component.html',
  styleUrls: ['./suggest.dialog.component.scss']
})
export class SuggestDialogComponent implements OnInit {

  dataSource: ApiDataSource | null;
  selection = new SelectionModel<string>(true, []);

  totalRecords = 0;
  columns = ['select', 'posted', 'code', 'description'];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(@Inject(MD_DIALOG_DATA) public data: any,
    private apiService: ApiService) { }

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.data.docType, this.data.pageSize, this.paginator, this.sort);

    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(300)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
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
      this._sort.sortChange,
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


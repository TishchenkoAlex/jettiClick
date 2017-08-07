import { Component, ElementRef, ViewChild, OnInit, Input } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, SelectionModel } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/debounceTime';
import { ApiService } from '../../services/api.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.css'],
  templateUrl: './datatable.component.html',
  // tslint:disable-next-line:class-name
}) export class commonDataTableComponent implements OnInit {
  displayedColumns = ['select', 'date', 'code', 'description', 'posted'];
  selection = new SelectionModel<string>(true, []);
  dataSource: ApiDataSource | null;

  @Input() docType = 'Document.ClientOrder';
  @Input() pageSize = 10;
  totalRecords = 0;

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private apiService: ApiService) { };

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.apiService, this.docType, this.pageSize, this.paginator, this.sort);
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

    if (this.filter.nativeElement.value) {
      return this.selection.selected.length === this.dataSource.renderedData.length;
    } else {
      return this.selection.selected.length === this.dataSource.renderedData.length;
    }
  }

  masterToggle() {
    if (!this.dataSource) { return; }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      this.dataSource.renderedData.forEach(data => this.selection.select(data.id));
    } else {
      this.dataSource.renderedData.forEach(data => this.selection.select(data.id));
    }
  }
}

export class ApiDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  renderedData: any[];

  constructor(private apiService: ApiService, private docType: string, private pageSize: number,
    private _paginator: MdPaginator,
    private _sort: MdSort) {
    super();
    this._paginator.pageSize = pageSize;
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this._sort.mdSortChange,
      this._filterChange,
      this._paginator.page,
    ];

    return Observable.merge(...displayDataChanges).switchMap((c) => {
      const filter = this._filterChange.value ? `description ILIKE '*${this._filterChange.value}*'` : '';
      return this.apiService.getDocList(this.docType,
        (this._paginator.pageIndex) * this._paginator.pageSize, this._paginator.pageSize,
        this._sort.active ? this._sort.active + ' ' + this._sort.direction : '', filter)
      .do((data) => {
        if (!this.renderedData || this._filterChange.value) {
          this.apiService.getDocsCount(this.docType, filter)
          .subscribe(count => {
            this._paginator.length = count;
          });
        };
        this.renderedData = data;
        });
    });
  }

  disconnect() { }
}

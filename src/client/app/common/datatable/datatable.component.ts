import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MdPaginator, MdSort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { JETTI_DOC_PROP } from '../../common/doc.model';
import { DocumentComponent } from '../../common/dynamic-component/dynamic-component';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: string };

@Component({
  selector: 'common-datatable',
  styleUrls: ['./datatable.component.scss'],
  templateUrl: './datatable.component.html',
})
export class CommonDataTableComponent implements DocumentComponent, OnInit, OnDestroy {

  protected _delete$: Subscription = Subscription.EMPTY;
  protected _save$: Subscription = Subscription.EMPTY;
  protected _filter$: Subscription = Subscription.EMPTY;

  displayedColumns = [];
  selection = new SelectionModel<string>(true, []);
  dataSource: ApiDataSource | null;

  @Input() data;
  @Input() actionTepmlate: TemplateRef<any>;

  totalRecords = 0;
  columns: ColDef[] = [];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private ds: DocService) { };

  ngOnInit() {
    this.dataSource = new ApiDataSource(this.ds.api, this.data.docType, this.data.pageSize, this.paginator, this.sort);

    this._filter$ = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    const view = (this.route.data['value'].detail);
    Object.keys(view).map((property) => {
      if (JETTI_DOC_PROP.indexOf(property) > -1 || (view[property].constructor === Array)) { return; }
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
      this.displayedColumns.unshift('select', 'posted', 'code', 'description');
    }

    this._delete$ = this.ds.delete$
      .filter(doc => doc.type === this.data.docType)
      .subscribe(doc => {
        this.refresh();
      });

    this._save$ = this.ds.save$
    .filter(doc => doc.type === this.data.docType)
    .subscribe(doc => {
      this.refresh();
    });
  }

  ngOnDestroy() {
    this._delete$.unsubscribe();
    this._save$.unsubscribe();
    this._filter$.unsubscribe();
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
    this.router.navigate([this.data.docType, 'new'])
  }

  copy() {
    this.router.navigate([this.data.docType, 'copy-' + this.selection.selected[0]])
  }

  open(row) {
    this.router.navigate([this.data.docType, row.id])
  }

  delete() {
    this.selection.selected.forEach(element => {
      this.ds.delete(element);
    });
  }

  close() {
    console.log('BASE CLOSE');
    this.ds.close(this.data);
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
        this.isLoadingResults = false;
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

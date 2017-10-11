import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ApiService, Continuation } from '../../services/api.service';
import { DocModel } from '../doc.model';
import { FilterObject } from './datatable.component';

export class ApiDataSource extends DataSource<any> {
  paginator = new BehaviorSubject('');
  selection = new SelectionModel<string>(true, []);

  _filterObjextChangeSubscription: Subscription = Subscription.EMPTY;
  _filterObjextChange = new BehaviorSubject<FilterObject>(null);
  get filterObjext(): FilterObject { return this._filterObjextChange.value; }
  set filterObjext(filterObjext: FilterObject) { this._filterObjextChange.next(filterObjext); }

  renderedData: DocModel[] = [];
  private firstDoc = new DocModel(this._docType, 'first');
  private lastDoc = new DocModel(this._docType, 'last');

  private _selectedID = '';

  continuation: Continuation = { first: this.firstDoc, last: this.lastDoc };
  isLoadingResults = true;
  private result$: Observable<any[]>;

  constructor(private apiService: ApiService, private _docType: string, private pageSize: number, private _sort: MatSort) {
    super();
    this._sort.direction = 'asc';

    this._filterObjextChangeSubscription = this._filterObjextChange.subscribe();

    this.result$ = Observable.merge(...[
      this._filterObjextChange,
      this._sort.sortChange,
      this.paginator,
    ])
      .filter(stream => !!stream)
      .switchMap((stream) => {
        console.log('STREAM', stream);
        this.isLoadingResults = true;

        let offset = 0; let row = this.firstDoc;
        if (this.selection.selected.length) {
          offset = this.renderedData.findIndex(s => s.id === this.selection.selected[0]);
          if (offset !== -1) { row = this.renderedData[offset] } else { offset = this.pageSize - 1; }
        }

        switch (stream) {
          case 'first': row = this.firstDoc; this.selection.clear(); offset = 0; break;
          case 'prev': row = this.continuation.first; this.selection.clear(); offset = 0; break;
          case 'next': row = this.continuation.last; this.selection.clear(); offset = 0; break;
          case 'last': row = this.lastDoc; this.selection.clear(); offset = 0; break;
          case 'refresh': row = this.renderedData[offset]; break;
          case 'goto': row = new DocModel(this._docType, this._selectedID); this.selection.select(this._selectedID); break;
        }

        let sort = ''; let command = this.paginator.value || 'first';
        if (this._sort.active) {
          if (stream['active']) {
            if (row === this.firstDoc) {
              command = 'first';
            } else {
              command = 'sort';
            }
          }
          sort = this._sort.active + '*' + this._sort.direction;
        }

        const filter = stream['columnFilter'] || '';

        return this.apiService.getDocList(this._docType, row.id, command, this.pageSize, offset, sort, filter)
          .do(data => { this.renderedData = data.data; this.continuation = data.continuation; this.isLoadingResults = false })
          .catch(err => { this.renderedData = []; this.isLoadingResults = false; return Observable.of([]) });
      })
      .map(data => data['data'])
  }

  connect(): Observable<any[]> { return this.result$ }

  disconnect() { }

  refresh() { this.paginator.next('refresh') }

  goto(id: string) { this._selectedID = id; this.paginator.next('goto') }

  first() { this.paginator.next('first') }

  last() { this.paginator.next('last') }

  next() { this.paginator.next('next') }

  prev() { this.paginator.next('prev') }

  isAllSelected(): boolean {
    if (this.selection.isEmpty()) { return false; }
    return this.selection.selected.length >= this.renderedData.length;
  }

  masterToggle() {
    if (this.isAllSelected()) { this.selection.clear(); } else {
      this.renderedData.forEach(data => this.selection.select(data.id));
    }
  }

}

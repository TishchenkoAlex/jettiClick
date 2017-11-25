import { DataTable } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { Continuation, DocListResponse2 } from '../../../../server/models/api';
import { FormListFilter, FormListOrder } from '../../../../server/models/user.settings';
import { DocModel, IDocBase } from '../../../../server/modules/doc.base';
import { ApiService } from '../../services/api.service';

interface DatasourceCommand { source: any, command: string, data?: any }

export class ApiDataSource {
  private paginator = new Subject<DatasourceCommand>();
  private firstDoc = new DocModel(this.docType, 'first');
  private lastDoc = new DocModel(this.docType, 'last');
  private result$: Observable<IDocBase[]>;

  renderedData: DocModel[] = [];
  continuation: Continuation = { first: this.firstDoc, last: this.lastDoc };
  private EMPTY: DocListResponse2 = { data: [], continuation: { first: this.continuation.first, last: this.continuation.first } };

  constructor(private apiService: ApiService, private docType: string, private pageSize: number, public dataTable: DataTable = null) {
    this.result$ = this.paginator.pipe(
      filter(stream => (this.dataTable !== null) && !(
        (stream.command === 'prev' && !this.continuation.first) ||
        (stream.command === 'next' && !this.continuation.last))),
      switchMap(stream => {
        let row = this.firstDoc; let offset = 0;
        const id = this.dataTable.selection && this.dataTable.selection.length ?  this.dataTable.selection[0].id : null;
        switch (stream.command) {
          case 'first': row = this.firstDoc; break;
          case 'prev': row = this.continuation.first; break;
          case 'next': row = this.continuation.last; break;
          case 'last': row = this.lastDoc; break;
          case 'refresh': case 'sort':
            offset = this.renderedData.findIndex(r => r.id === id);
            if (offset === -1) { offset = 0 }
            row = this.renderedData[offset] || this.firstDoc;
            break;
          case 'goto': row = new DocModel(this.docType, stream.data); break;
        }

        const filterArr = Object.keys(this.dataTable.filters || {})
          .map(el => <FormListFilter>({ left: el, right: this.dataTable.filters[el].value, center: '=' }));
        const sortArr = (this.dataTable.multiSortMeta || [])
          .map(el => <FormListOrder>({ field: el.field, order: el.order === -1 ? 'desc' : 'asc' }));

        return this.apiService.getDocList(this.docType, row.id, stream.command, this.pageSize, offset, sortArr, filterArr).pipe(
          tap(data => {
            this.renderedData = data.data;
            this.continuation = data.continuation;
            if (['first', 'last', 'next', 'prev'].indexOf(stream.command) > -1) { this.dataTable.selection = [data.data[0]] || [] }
          }),
          catchError(err => { this.renderedData = []; return Observable.of(this.EMPTY) }));
      }),
      map(data => data['data']))
  }

  connect(): Observable<DocModel[]> { return this.result$ }

  refresh() { this.paginator.next({ source: this.paginator, command: 'refresh'}) }

  goto(id: string) { this.paginator.next({ source: this.paginator, command: 'goto', data: id }) }

  sort() { this.paginator.next({ source: this.paginator, command: 'sort' }) }

  first() { this.paginator.next({ source: this.paginator, command: 'first' }) }

  last() { this.paginator.next({ source: this.paginator, command: 'last' }) }

  next() { this.paginator.next({ source: this.paginator, command: 'next' }) }

  prev() { this.paginator.next({ source: this.paginator, command: 'prev' }) }

}

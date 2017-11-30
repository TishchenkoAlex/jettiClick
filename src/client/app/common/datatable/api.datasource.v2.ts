import { DataTable } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { Continuation, DocListResponse } from '../../../../server/models/api';
import { FormListFilter, FormListOrder, matchOperator } from '../../../../server/models/user.settings';
import { DocModel, IDocBase } from '../../../../server/modules/doc.base';
import { UserSettingsService, FormListSettingsAction } from '../../auth/settings/user.settings.service';
import { ApiService } from '../../services/api.service';

interface DatasourceCommand { source: any, command: string, data?: any }

export class ApiDataSource {
  private paginator = new Subject<DatasourceCommand>();
  private firstDoc = new DocModel(this.docType, 'first');
  private lastDoc = new DocModel(this.docType, 'last');
  private result$: Observable<IDocBase[]>;

  renderedData: DocModel[] = [];
  continuation: Continuation = { first: this.firstDoc, last: this.lastDoc };
  private EMPTY: DocListResponse = { data: [], continuation: { first: this.continuation.first, last: this.continuation.first } };

  constructor(private apiService: ApiService, private docType: string, private pageSize: number, public dataTable: DataTable = null,
    private uss: UserSettingsService) {
    this.result$ = Observable.merge(...[
      this.paginator,
      this.uss.formListSettings$]).pipe(
      filter((stream: any) => (this.dataTable !== null) && !(
        (stream.command === 'prev' && !this.continuation.first) ||
        (stream.command === 'next' && !this.continuation.last))),
      filter(stream => (stream['type'] === undefined) || (stream['type'] === this.docType)),
      switchMap(stream => {
        let row = this.firstDoc; let offset = 0;
        const id = this.dataTable.selection && this.dataTable.selection.length ? this.dataTable.selection[0].id : null;
        switch (stream.command) {
          case 'first': row = this.firstDoc; break;
          case 'prev': row = this.continuation.first; break;
          case 'next': row = this.continuation.last; break;
          case 'last': row = this.lastDoc; break;
          case 'refresh': case 'sort': case undefined:
            offset = this.renderedData.findIndex(r => r.id === id);
            if (offset === -1) { offset = 0;  } else { row = this.renderedData[offset] }
            stream.command = 'sort';
            break;
          case 'goto': row = new DocModel(this.docType, stream.data); break;
        }

        const filterArr = stream['type'] ? (stream as FormListSettingsAction).payload.filter :
          this.uss.userSettings.formListSettings[this.docType] ?
            this.uss.userSettings.formListSettings[this.docType].filter : [];

        const sortArr = (this.dataTable.multiSortMeta || [])
          .map(el => <FormListOrder>({ field: el.field, order: el.order === -1 ? 'desc' : 'asc' }));

        if (!row) { stream.command = 'fisrt'; row = this.firstDoc }
        return this.apiService.getDocList(this.docType, row.id, stream.command, this.pageSize, offset, sortArr, filterArr).pipe(
          tap(data => {
            this.renderedData = data.data;
            this.continuation = data.continuation;
            if (stream.command === 'goto') {
              const gotoRow = this.renderedData.find(el => el.id === stream.data);
              this.dataTable.selection = [gotoRow] || [];
            }
            if (['first', 'last', 'next', 'prev'].indexOf(stream.command) > -1) { this.dataTable.selection = [] }
          }),
          catchError(err => { this.renderedData = []; return Observable.of(this.EMPTY) }));
      }),
      map(data => data['data']));
  }

  connect(): Observable<DocModel[]> { return this.result$ }

  refresh() { this.paginator.next({ source: this.paginator, command: 'refresh' }) }

  goto(id: string) { this.paginator.next({ source: this.paginator, command: 'goto', data: id }) }

  sort() { this.paginator.next({ source: this.paginator, command: 'sort' }) }

  first() { this.paginator.next({ source: this.paginator, command: 'first' }) }

  last() { this.paginator.next({ source: this.paginator, command: 'last' }) }

  next() { this.paginator.next({ source: this.paginator, command: 'next' }) }

  prev() { this.paginator.next({ source: this.paginator, command: 'prev' }) }

}

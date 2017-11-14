import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs/Observable';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { Continuation, DocListResponse2 } from '../../../../server/models/api';
import { DocModel } from '../../../../server/modules/doc.base';
import { FormListSettingsAction, UserSettingsService } from '../../auth/settings/user.settings.service';
import { ApiService } from '../../services/api.service';
import { MatSort } from '@angular/material';

export class ApiDataSource extends DataSource<any> {
  paginator = new Subject<string>();
  selection = new SelectionModel<string>(true, []);

  renderedData: DocModel[] = [];
  private firstDoc = new DocModel(this.docType, 'first');
  private lastDoc = new DocModel(this.docType, 'last');

  private _selectedID = '';

  continuation: Continuation = { first: this.firstDoc, last: this.lastDoc };
  private result$: Observable<any[]>;

  constructor(private apiService: ApiService, private docType: string,
    private pageSize: number, private uss: UserSettingsService, private sort: MatSort) {
    super();

    this.result$ = Observable.merge(...[
      this.paginator,
      this.uss.formListSettings$,
      this.sort.sortChange
    ]).pipe(
      filter(stream => (stream['type'] === undefined) || (stream['type'] === this.docType)),
      switchMap((stream: string | FormListSettingsAction) => {
        let offset = 0; let row = this.firstDoc;
        if (this.selection.selected.length) {
          const selectedId = this.selection.selected[this.selection.selected.length - 1];
          this.selection.clear();
          this.selection.select(selectedId);
          offset = this.renderedData.findIndex(s => s.id === selectedId);
          if (offset !== -1) { row = this.renderedData[offset] } else { offset = this.pageSize - 1; }
        }

        switch (stream) {
          case 'first': row = this.firstDoc; this.selection.clear(); offset = 0; break;
          case 'prev': row = this.continuation.first; this.selection.clear(); offset = 0; break;
          case 'next': row = this.continuation.last; this.selection.clear(); offset = 0; break;
          case 'last': row = this.lastDoc; this.selection.clear(); offset = 0; break;
          case 'refresh': row = this.renderedData[offset] || this.firstDoc; break;
          case 'goto': row = new DocModel(this.docType, this._selectedID); offset = 0;
            this.selection.clear(); this.selection.select(this._selectedID); break;
        }

        let command = typeof stream === 'string' ? stream : 'first';

        const filterArr = stream['type'] ? (stream as FormListSettingsAction).payload.filter :
          this.uss.userSettings.formListSettings[this.docType] ?
            this.uss.userSettings.formListSettings[this.docType].filter : [];

        const sortArr = stream['type'] ? (stream as FormListSettingsAction).payload.order :
            this.uss.userSettings.formListSettings[this.docType] ?
              this.uss.userSettings.formListSettings[this.docType].order : [ { field: this.sort.active, order: this.sort.direction }];
        if (stream['type'] && row.id !== 'first' && (stream as FormListSettingsAction).payload.order) { command = 'sort' }

        return this.apiService.getDocList(this.docType, row.id, command, this.pageSize, offset, sortArr, filterArr).pipe(
          tap(data => { this.renderedData = data.data; this.continuation = data.continuation }),
          catchError(err => {
            this.renderedData = [];
            const EMPTY: DocListResponse2 = { data: [], continuation: { first: this.continuation.first, last: this.continuation.first } }
            return Observable.of(EMPTY)
          }));
      }),
      map(data => data['data']))
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

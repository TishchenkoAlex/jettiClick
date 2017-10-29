import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Continuation, DocListResponse2 } from '../../../../server/models/api';
import { DocModel } from '../../../../server/modules/doc.base';
import { FormListSettingsAction, UserSettingsService } from '../../auth/settings/user.settings.service';
import { ApiService } from '../../services/api.service';

export class ApiDataSource extends DataSource<any> {
  paginator = new Subject<string>();
  selection = new SelectionModel<string>(true, []);

  renderedData: DocModel[] = [];
  private firstDoc = new DocModel(this._docType, 'first');
  private lastDoc = new DocModel(this._docType, 'last');

  private _selectedID = '';

  continuation: Continuation = { first: this.firstDoc, last: this.lastDoc };
  private result$: Observable<any[]>;

  constructor(private apiService: ApiService, private _docType: string,
    private pageSize: number, private uss: UserSettingsService) {
    super();

    this.result$ = Observable.merge(...[
      this.paginator,
      this.uss.formListSettings$,
    ]).filter(stream => (stream['type'] === undefined) || (stream['type'] === this._docType))
      .switchMap((stream: Sort | string | FormListSettingsAction) => {
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
          case 'refresh': row = this.renderedData[offset] || this.firstDoc; break;
          case 'goto': row = new DocModel(this._docType, this._selectedID); this.selection.select(this._selectedID); break;
        }

        const command = typeof stream === 'string' ? stream : 'first';

        const filter = stream['type'] ? (stream as FormListSettingsAction).payload.filter :
            this.uss.userSettings.formListSettings[this._docType] ?
              this.uss.userSettings.formListSettings[this._docType].filter : [];

        const sort = stream['type'] ? (stream as FormListSettingsAction).payload.order :
          this.uss.userSettings.formListSettings[this._docType] ?
            this.uss.userSettings.formListSettings[this._docType].order : [];

        return this.apiService.getDocList(this._docType, row.id, command, this.pageSize, offset, sort, filter)
          .do(data => { this.renderedData = data.data; this.continuation = data.continuation })
          .catch(err => {
            this.renderedData = [];
            const EMPTY: DocListResponse2 = { data: [], continuation: { first: this.continuation.first, last: this.continuation.first }}
            return Observable.of(EMPTY)
          });
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

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { catchError, filter, map, share, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { Continuation, DocListResponse } from '../../../../server/models/api';
import { DocTypes } from '../../../../server/models/documents.types';
import { FormListSettings } from '../../../../server/models/user.settings';
import { ApiService } from '../../services/api.service';
import { DocumentBase } from './../../../../server/models/document';

interface DatasourceCommand { command: string; data?: any; }

export class ApiDataSource {

  private paginator = new Subject<DatasourceCommand>();

  id = '';
  formListSettings = new BehaviorSubject<FormListSettings>(new FormListSettings());

  result$: Observable<DocumentBase[]>;
  renderedData: DocumentBase[] = [];

  continuation: Continuation = { first: { id: 'first', type: this.type }, last: { id: 'last', type: this.type } };
  private EMPTY: DocListResponse = { data: [], continuation: { first: this.continuation.first, last: this.continuation.first } };

  constructor(public api: ApiService, public type: DocTypes = null, public pageSize = 10) {

    this.result$ = this.paginator.pipe(
      filter(stream => !(
        (stream.command === 'prev' && !this.continuation.first) ||
        (stream.command === 'next' && !this.continuation.last))),
      switchMap(stream => {
        let offset = 0;
        let id = this.id;
        switch (stream.command) {
          case 'prev': id = this.continuation.first.id as string; break;
          case 'next': id = this.continuation.last.id as string; break;
          case 'refresh': case 'sort': case undefined:
            offset = this.renderedData.findIndex(r => r.id === id);
            if (offset === -1) { offset = 0; } else { id = this.renderedData[offset].id; }
            stream.command = 'sort';
            break;
          case 'goto': id = stream.data; break;
        }

        return this.api.getDocList(this.type, id, stream.command, this.pageSize, offset,
          this.formListSettings.value.order, this.formListSettings.value.filter).pipe(
          tap(data => {
            this.renderedData = data.data;
            this.continuation = data.continuation;
          }),
          catchError(err => {
            this.renderedData = this.EMPTY.data;
            this.continuation = this.EMPTY.continuation;
            return observableOf(this.EMPTY);
          }));
      }),
      map(data => data.data), share());
  }

  refresh(id: string) { this.paginator.next({ command: 'refresh' }); }
  goto(id: string) { this.id = id; this.paginator.next({ command: 'goto' }); }
  sort() { this.paginator.next({ command: 'sort' }); }
  first() { this.paginator.next({ command: 'first' }); }
  last() { this.paginator.next({ command: 'last' }); }
  next() { this.paginator.next({ command: 'next' }); }
  prev() { this.paginator.next({ command: 'prev' }); }

}

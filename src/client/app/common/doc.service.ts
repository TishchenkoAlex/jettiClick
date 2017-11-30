import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { DocModel } from '../../../server/modules/doc.base';
import { dateReviver } from '../common/utils';
import { ApiService } from '../services/api.service';

@Injectable()
export class DocService {

  protected _closeDoc = new Subject<DocModel>();
  close$ = this._closeDoc.asObservable();

  protected _saveDoc = new Subject<DocModel>();
  save$ = this._saveDoc.asObservable();

  protected _saveCloseDoc = new Subject<DocModel>();
  saveCloseDoc$ = this._saveCloseDoc.asObservable();

  protected _deleteDoc = new Subject<DocModel>();
  delete$ = this._deleteDoc.asObservable();

  protected _do = new Subject<any>();
  do$ = this._do.asObservable();

  protected _goto = new Subject<any>();
  goto$ = this._goto.asObservable();

  constructor(public api: ApiService, private messageService: MessageService) { };

  do(doc: DocModel) {
    this._do.next(doc);
  }

  goto(doc: DocModel) {
    this._goto.next(doc);
  }

  close(doc: DocModel) {
    this._closeDoc.next(doc);
  }

  save(doc: DocModel, close: boolean = false) {
    this.api.postDoc(doc).pipe(
      take(1))
      .subscribe((savedDoc: DocModel) => {
        savedDoc = JSON.parse(JSON.stringify(savedDoc), dateReviver);
        if (close) { this._saveCloseDoc.next(savedDoc) } else { this._saveDoc.next(savedDoc) }
        this.openSnackBar(savedDoc.description, savedDoc.posted ? 'posted' : 'unposted');
      },
      (err) => this.openSnackBar(doc.description, 'Error on post! '));
  }

  delete(id: string) {
    this.api.deleteDoc(id).pipe(
      take(1))
      .subscribe((deletedDoc: DocModel) => {
        deletedDoc = JSON.parse(JSON.stringify(deletedDoc), dateReviver);
        this._deleteDoc.next(deletedDoc);
        this.openSnackBar(deletedDoc.description, deletedDoc.deleted ? 'deleted' : 'undeleted');
      });
  }

  post(doc: string) {
    return this.api.postDocById(doc).toPromise();
  }

  openSnackBar(message: string, action: string) {
    this.messageService.add({severity: 'success', summary: message, detail: action})
  }

}

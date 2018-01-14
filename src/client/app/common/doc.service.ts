import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { ConfirmationService } from 'primeng/primeng';
import { shareReplay, take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { ApiService } from '../services/api.service';
import { DocumentBase } from './../../../server/models/document';

@Injectable()
export class DocService {

  protected _closeDoc = new Subject<DocumentBase>();
  close$ = this._closeDoc.asObservable();

  protected _saveDoc = new Subject<DocumentBase>();
  save$ = this._saveDoc.asObservable();

  protected _saveCloseDoc = new Subject<DocumentBase>();
  saveCloseDoc$ = this._saveCloseDoc.asObservable();

  protected _deleteDoc = new Subject<DocumentBase>();
  delete$ = this._deleteDoc.asObservable();

  protected _do = new Subject<DocumentBase>();
  do$ = this._do.asObservable();

  protected _goto = new Subject<DocumentBase>();
  goto$ = this._goto.asObservable();

  constructor(public api: ApiService, private messageService: MessageService, public confirmationService: ConfirmationService) { }

  do(doc: DocumentBase) {
    this._do.next(doc);
  }

  goto(doc: DocumentBase) {
    this._goto.next(doc);
  }

  close(doc: DocumentBase) {
    this._closeDoc.next(doc);
  }

  save(doc: DocumentBase, close: boolean = false) {
    this.api.postDoc(doc).pipe(take(1))
      .subscribe(savedDoc => {
        if (close) { this._saveCloseDoc.next(savedDoc); } else { this._saveDoc.next(savedDoc); }
        this.openSnackBar('success', savedDoc.description, savedDoc.posted ? 'posted' : 'unposted');
      },
      (err) => this.openSnackBar('error', doc.description, err.error));
  }

  delete(id: string) {
    this.api.deleteDoc(id).pipe(take(1))
      .subscribe(deletedDoc => {
        this._deleteDoc.next(deletedDoc);
        this.openSnackBar('succes', deletedDoc.description, deletedDoc.deleted ? 'deleted' : 'undeleted');
      },
      (err) => this.openSnackBar('error', id, err.error));
  }

  post(id: string) {
    return this.api.postDocById(id).toPromise();
  }

  unpost(id: string) {
    return this.api.unpostDocById(id).toPromise();
  }

  openSnackBar(severity: string, message: string, detail: string) {
    this.messageService.add({ severity: severity, summary: message, detail: detail, id: Math.random() });
  }

}

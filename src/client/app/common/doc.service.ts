import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { filter, take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { DocModel } from '../../../server/modules/doc.base';
import { ApiService } from '../services/api.service';

@Injectable()
export class DocService {

  protected _closeDoc = new Subject<DocModel>();
  close$ = this._closeDoc.asObservable();

  protected _saveDoc = new Subject<DocModel>();
  save$ = this._saveDoc.asObservable();

  protected _deleteDoc = new Subject<DocModel>();
  delete$ = this._deleteDoc.asObservable();

  protected _do = new Subject<any>();
  do$ = this._do.asObservable();

  protected _goto = new Subject<any>();
  goto$ = this._goto.asObservable();

  constructor(public api: ApiService, public snackBar: MatSnackBar) { };

  do(doc: DocModel) {
    this._do.next(doc);
  }

  goto(doc: DocModel) {
    this._goto.next(doc);
  }

  close(doc: DocModel) {
    this._closeDoc.next(doc);
  }

  save(doc: DocModel) {
    this.api.postDoc(doc).pipe(
      filter(result => {
        if (result instanceof HttpErrorResponse) {
          this.openSnackBar(doc.description, 'Error on post! ');
          return false;
        };
        return true;
      }),
      take(1))
      .subscribe((savedDoc: DocModel) => {
        this._saveDoc.next(savedDoc);
        this.openSnackBar(savedDoc.description, savedDoc.posted ? 'posted' : 'unposted');
      });
  }

  delete(id: string) {
    this.api.deleteDoc(id).pipe(
      take(1))
      .subscribe((deletedDoc: DocModel) => {
        this._saveDoc.next(deletedDoc);
        this.openSnackBar(deletedDoc.description, deletedDoc.deleted ? 'deleted' : 'undeleted');
      });
  }

  post(doc: string) {
    return this.api.postDocById(doc);
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, { duration: 5000 });
  }

}

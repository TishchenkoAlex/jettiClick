import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs/Subject';

import { AuthService } from '../auth/auth.service';
import { ApiService } from '../services/api.service';
import { DocModel } from './doc.model';

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

  constructor(public api: ApiService, private authService: AuthService, public snackBar: MatSnackBar) { };

  do(doc: DocModel) {
    this._do.next(doc);
  }

  close(doc: DocModel) {
    this._closeDoc.next(doc);
  }

  save(doc: DocModel) {
    this.api.postDoc(doc)
      .take(1)
      .subscribe((savedDoc: DocModel) => {
        this._saveDoc.next(savedDoc);
        this.openSnackBar(savedDoc.description, savedDoc.posted ? 'posted' : 'unposted');
      });
  }

  delete(id: string) {
    this.api.deleteDoc(id)
      .take(1)
      .subscribe((deletedDoc: DocModel) => {
        this._saveDoc.next(deletedDoc);
        this.openSnackBar(deletedDoc.description, deletedDoc.deleted ? 'deleted' : 'undeleted');
      });
  }

  post(doc: DocModel) {
    return this.api.postDocById(doc.id)
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
    });
  }

}

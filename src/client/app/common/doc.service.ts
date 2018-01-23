import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { ConfirmationService } from 'primeng/primeng';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { ApiService } from '../services/api.service';
import { DocumentBase } from './../../../server/models/document';

@Injectable()
export class DocService {

  save$ = new Subject<DocumentBase>();
  post$ = new Subject<boolean>();
  unpost$ = new Subject<boolean>();
  delete$ = new Subject<DocumentBase>();
  close$ = new Subject<DocumentBase>();
  saveClose$ = new Subject<DocumentBase>();
  goto$ = new Subject<DocumentBase>();
  do$ = new Subject<DocumentBase>();

  constructor(public api: ApiService, private messageService: MessageService, public confirmationService: ConfirmationService) { }

  save(doc: DocumentBase, close: boolean = false) {
    return this.api.postDoc(doc).toPromise()
      .then(savedDoc => {
        this.openSnackBar('success', savedDoc.description, savedDoc.posted ? 'posted' : 'unposted');
        const subject$ = close ?  this.saveClose$ : this.save$;
        subject$.next(savedDoc);
      });
  }

  delete(id: string) {
    return this.api.deleteDoc(id).toPromise()
      .then(deletedDoc => {
        this.delete$.next(deletedDoc);
        this.openSnackBar('success', deletedDoc.description, deletedDoc.deleted ? 'deleted' : 'undeleted');
      });
  }

  post(id: string) {
    return this.api.postDocById(id).toPromise()
      .then(result => this.post$.next(result));
  }

  unpost(id: string) {
    return this.api.unpostDocById(id).toPromise()
      .then(result => this.unpost$.next(result));
  }

  openSnackBar(severity: string, message: string, detail: string) {
    this.messageService.add({ severity: severity, summary: message, detail: detail, id: Math.random() });
  }

}

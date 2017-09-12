import { ApiService } from '../services/api.service';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { DocModel } from './_doc.model';

@Injectable()
export class DocService {

    private _closeDoc = new Subject<DocModel>();
    close$ = this._closeDoc.asObservable();

    private _saveDoc = new Subject<DocModel>();
    save$ = this._saveDoc.asObservable();

    private _deleteDoc = new Subject<DocModel>();
    delete$ = this._deleteDoc.asObservable();

    constructor (public api: ApiService) {};

    close(doc: DocModel) {
        this._closeDoc.next(doc);
    }

    save(doc: DocModel) {
        this.api.postDoc(doc)
        .share()
        .subscribe((savedDoc: DocModel) => {
          savedDoc.date = new Date(savedDoc.date);
          this._saveDoc.next(savedDoc);
        });
    }

    delete(id: string) {
        this.api.deleteDoc(id)
        .share()
        .subscribe((deletedDoc: DocModel) => {
          deletedDoc.date = new Date(deletedDoc.date);
          this._saveDoc.next(deletedDoc);
        });
    }

}

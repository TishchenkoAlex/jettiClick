import { DocModel } from './_doc.model';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class DocService {

    private _closeDoc = new Subject<DocModel>();
    closeDoc$ = this._closeDoc.asObservable();

    closeDoc(doc: DocModel) {
        this._closeDoc.next(doc);
    }
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { DocModel } from './_doc.model';

@Injectable()
export class DocService {

    private _closeDoc = new Subject<DocModel>();
    closeDoc$ = this._closeDoc.asObservable();

    closeDoc(doc: DocModel) {
        this._closeDoc.next(doc);
    }
}

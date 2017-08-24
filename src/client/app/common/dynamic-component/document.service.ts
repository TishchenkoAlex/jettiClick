import { Observable } from 'rxjs/Observable';
import { DocModel } from '../_doc.model';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class DocumentService {

    private _document = new Subject<DocModel>();
    private _cancel = new Subject<DocModel>();

    document$ = this._document.asObservable();
    cancel$ = this._cancel.asObservable()

    setDocument(document: DocModel) { this._document.next(document); }
    setCancel(document: DocModel) { this._cancel.next(document); }

}

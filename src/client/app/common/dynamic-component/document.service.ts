import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { DocModel } from '../_doc.model';
import { ApiService } from '../../services/api.service';

@Injectable()
export class DocumentService {

  private _onChange = new Subject<DocModel>();
  private _onCancel = new Subject<DocModel>();
  private _beforePost = new Subject<DocModel>();
  private _onPost = new Subject<DocModel>();
  private _afterPost = new Subject<DocModel>();

  onChange$ = this._onChange.asObservable();
  onCancel$ = this._onCancel.asObservable();
  beforePost$ = this._beforePost.asObservable();
  onPost$ = this._onPost.asObservable();
  afterPost$ = this._afterPost.asObservable();

  constructor(private api: ApiService) {
    this.beforePost$.subscribe(doc => {
      this.onPost(doc);
    });
    this.onPost$.subscribe(doc => {
      if (!doc.date) { doc.date = new Date(); }
      this.api.postDoc(doc).subscribe((posted: DocModel) => {
        this.afterPost(posted);
      });
    });
    this.afterPost$.subscribe(doc => {
      this.onChange(doc);
    });
  }

  onChange(document: DocModel) { this._onChange.next(document); }
  onCancel(document: DocModel) { this._onCancel.next(document); }
  beforePost(document: DocModel) { this._beforePost.next(document); }
  onPost(document: DocModel) { this._onPost.next(document); }
  afterPost(document: DocModel) { this._afterPost.next(document); }

  Post(document: DocModel) {
    this.beforePost(document);
  }

}

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

  constructor(public api: ApiService) { };

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

  createNewDoc(model: DocModel, formDoc): DocModel {
    const newDoc: DocModel = {
      id: model.id,
      type: model.type,
      date: formDoc.date || new Date(model.date),
      code: formDoc.code,
      description: formDoc.description || model.description,
      posted: model.posted,
      deleted: model.deleted,
      parent: model.parent,
      isfolder: model.isfolder,
      doc: {}
    };

    const mapDoc = (s, d) => {
      const exclude = Object.keys(newDoc);
      for (const property in s) {
        if (s.hasOwnProperty(property)) {
          if (exclude.indexOf(property) > -1) { continue; }
          if (s[property] instanceof Array) {
            const copy = JSON.parse(JSON.stringify(s[property])) as any[];
            copy.forEach(element => {
              for (const p in element) {
                if (element.hasOwnProperty(p)) {
                  element[p] = element[p] ? element[p]['id'] || element[p] : element[p] || null;
                }
              }
            });
            d.doc[property] = copy;
          } else {
            d.doc[property] = s[property] ? s[property]['id'] || s[property] : s[property] || null;
          }
        }
      }
    }
    mapDoc(formDoc, newDoc);
    return newDoc;
  }
}

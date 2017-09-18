import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MdSnackBar } from '@angular/material';
import { Subject } from 'rxjs/Subject';

import { AuthService } from '../auth/auth.service';
import { ApiService } from '../services/api.service';
import { DocModel, JETTI_DOC_PROP } from './doc.model';
import { patchOptions } from './dynamic-form/dynamic-form.service';

@Injectable()
export class DocService {

  protected _closeDoc = new Subject<DocModel>();
  close$ = this._closeDoc.asObservable();

  protected _saveDoc = new Subject<DocModel>();
  save$ = this._saveDoc.asObservable();

  protected _deleteDoc = new Subject<DocModel>();
  delete$ = this._deleteDoc.asObservable();

  protected _do = new Subject<DocModel>();
  do$ = this._do.asObservable();

  constructor(public api: ApiService, private authService: AuthService, public snackBar: MdSnackBar) { };

  do(doc: DocModel) {
    this._do.next(doc);
  }

  close(doc: DocModel) {
    this._closeDoc.next(doc);
  }

  save(doc: DocModel) {
    this.api.postDoc(doc)
      .share()
      .subscribe((savedDoc: DocModel) => {
        this._saveDoc.next(savedDoc);
        this.openSnackBar(savedDoc.description, savedDoc.posted ? 'posted' : 'unposted');
      });
  }

  delete(id: string) {
    this.api.deleteDoc(id)
      .share()
      .subscribe((deletedDoc: DocModel) => {
        this._saveDoc.next(deletedDoc);
        this.openSnackBar(deletedDoc.description, deletedDoc.deleted ? 'deleted' : 'undeleted');
      });
  }

  createNewDoc(model: DocModel, formDoc): DocModel {
    const newDoc: DocModel = {
      id: model.id,
      type: model.type,
      date: formDoc.date || model.date,
      code: formDoc.code || model.code,
      description: formDoc.description || model.description,
      posted: model.posted,
      deleted: model.deleted,
      parent: model.parent,
      isfolder: model.isfolder,
      company: formDoc.company ? formDoc.company['id'] : model.company['id'],
      user: formDoc.user ? formDoc.user['id'] : model.user['id'] ||  this.authService.user ? this.authService.user.email : null,
      doc: {}
    };

    for (const property in formDoc) {
      if (!formDoc.hasOwnProperty(property)) { continue };
      if (JETTI_DOC_PROP.indexOf(property) > -1) { continue; }
      if ((formDoc[property] instanceof Array)) {
        const copy = JSON.parse(JSON.stringify(formDoc[property])) as any[];
        copy.forEach(element => {
          for (const p in element) {
            if (element.hasOwnProperty(p)) {
              element[p] = element[p] ? element[p]['id'] || element[p] : element[p] || null;
            }
          }
          delete element.index;
        });
        newDoc.doc[property] = copy;
      } else {
        newDoc.doc[property] = formDoc[property] ? formDoc[property]['id'] || formDoc[property] : formDoc[property] || null;
      }
    }
    return newDoc;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }

  OnClientScript(control: FormGroup, data: any, script: string) {
    const func = new Function('doc, value', script);
    const patch = func(control.parent.value, data);
    console.log('OnClientScript', data, script, patch);
    (control.parent as FormGroup).patchValue(patch, patchOptions);
  }
}

import { DocModel } from '../common/_doc.model';
import { OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DynamicFormService, ViewModel } from '../common/dynamic-form/dynamic-form.service';
import { ApiService } from '../services/api.service';
import { DocumentComponent } from '../common/dynamic-component/document.component';
import { DocumentService } from '../common/dynamic-component/document.service';

const dateISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d+)?Z/i;

export class UserFormComponent implements OnInit, DocumentComponent {
  data: any;
  viewModel: ViewModel;

  @ViewChild('form') form: NgForm;

  constructor(
    private _apiService: ApiService,
    private _router: Router,
    private _documentService: DocumentService) { }

  private normalizeObjectValues(obj) {
    for (const param in obj) {
      if (obj[param] && typeof obj[param] === 'object') {
        this.normalizeObjectValues(obj[param]);
      } else {
        if (typeof obj[param] === 'string') {
          if (dateISO.test(obj[param])) {
            obj[param] = new Date(obj[param]);
          }
        }
      }
    };
  };

  ngOnInit() {
    this._apiService.getViewModel(this.data.docType, this.data.docID)
      .subscribe((viewModel: ViewModel) => {
        this.viewModel = viewModel;
        this.normalizeObjectValues(this.viewModel.model);
        this._documentService.setDocument(this.viewModel.model);

        this.form.form.valueChanges
          .distinctUntilChanged()
          .subscribe((d) => {
            this._documentService.setDocument(this.viewModel.model);
          });
      });
  }

  getDocForPost(form: NgForm): DocModel {

    const result = Object.assign({}, this.viewModel.model);
    result.doc = {};

    const exclude = ['id', 'code', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'date', 'description'];
    for (const property in this.viewModel.model) {
      if (exclude.indexOf(property) > -1) { continue; }
      if (result[property] && typeof result[property] === 'object') {
        result.doc[property] = result[property]['id'] || result[property];
        delete result[property];
      } else {
        result.doc[property] = result[property];
        delete result[property];
      }
    };
    if (!result.date) { result.date = new Date(); }
    if (!result.code) { result.code = 'NOCODE'; }
    if (!result.description) {
      result.description = result.type + ' #' + result.code + ' ' + result.date + '';
    };
    return result;
 }

}

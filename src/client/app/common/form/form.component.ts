import { Component, EventEmitter, Input, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { DocumentComponent } from '../dynamic-component/document.component';
import { DynamicFormService, ViewModel } from '../dynamic-form/dynamic-form.service';
import { BaseDynamicControl } from '../dynamic-form/dynamic-form-base';
import { DynamicFormControlService } from '../dynamic-form/dynamic-form-control.service';
import { ApiService } from '../../services/api.service';
import { DocumentService } from '../dynamic-component/document.service';
import { DocModel } from '../_doc.model';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class CommonFromComponent implements DocumentComponent, OnInit {

  @Input() data;
  @Input() formTemplate: TemplateRef<any>;

  form: FormGroup = new FormGroup({});
  controls: BaseDynamicControl<any>[];
  document: any = {};

  constructor(
    private apiService: ApiService, private dfc: DynamicFormControlService,
    private dfs: DynamicFormService, private router: Router, private location: Location,
    private ds: DocumentService) {}

  ngOnInit() {
    this.dfs.getControls(this.data.docType, this.data.docID)
      .take(1)
      .subscribe((viewModel: ViewModel) => {
        this.controls = viewModel.view;
        this.document = viewModel.model;
        this.form = this.dfc.toFormGroup(this.controls);
        this.ds.setDocument(this.document);

        this.form.valueChanges
          .subscribe((d) => {
            this.ds.setDocument(d);
          });
      });
  }

  onSubmit() {
    const formDoc = this.form.value;
    const newDoc: DocModel = {
      id: this.document.id,
      type: this.document.type,
      date: formDoc.date,
      code: formDoc.code,
      description: formDoc.description,
      posted: false,
      deleted: false,
      parent: '',
      isfolder: false,
      doc: {}
    }

    const exclude = ['id', 'code', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'date', 'description'];
    for (const property in formDoc) {
      if (exclude.indexOf(property) > -1) { continue; }
      if (formDoc[property] && typeof formDoc[property] === 'object') {
        newDoc.doc[property] = formDoc[property]['id'] || formDoc[property];
      } else {
        newDoc.doc[property] = formDoc[property];
      }
    };
    if (!newDoc.date) { newDoc.date = this.document.date || new Date(); }
    if (!newDoc.code) { newDoc.code = 'NOCODE'; }
    if (!newDoc.description) {
      newDoc.description = this.document.description || (newDoc.type + ' #' + newDoc.code + ' ' + newDoc.date + '');
    };

    /*     this.apiService.postDoc(newDoc)
        .subscribe(posted => {
          this.form.patchValue(posted);
        }); */
  }

  handleOnCancel() {
    this.ds.setCancel(this.document);
    this.location.back();
    /*     this.router.navigateByUrl(`${this.docType}`) */
  }

  get controlsContex() {
    return {
      controls: this.controls
    }
  }
}

import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { DocumentComponent } from '../dynamic-component/document.component';
import { DynamicFormService, ViewModel } from '../dynamic-form/dynamic-form.service';
import { BaseDynamicControl } from '../dynamic-form/dynamic-form-base';
import { DynamicFormControlService } from '../dynamic-form/dynamic-form-control.service';
import { DocumentService } from '../dynamic-component/document.service';
import { DocModel } from '../_doc.model';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class CommonFromComponent implements DocumentComponent, OnInit, OnDestroy {

  @Input() data;
  @Input() userTepmlate: TemplateRef<any>;

  afterPost$: Subscription;

  document: DocModel;
  form: FormGroup;

  controls: BaseDynamicControl<any>[];
  controlsByKey = {};

  constructor(
    private fc: DynamicFormControlService, private fs: DynamicFormService, private ds: DocumentService,
    private router: Router, private location: Location) { }

  ngOnInit() {
    this.fs.getControls(this.data.docType, this.data.docID)
      .take(1)
      .subscribe((viewModel: ViewModel) => {
        this.controls = viewModel.view;
        this.document = viewModel.model;
        this.form = this.fc.toFormGroup(this.controls);
        this.controls.map(c => { this.controlsByKey[c.key] = c });
        this.ds.onChange(this.document);
      });

    this.afterPost$ = this.ds.afterPost$
      .distinctUntilChanged()
      .filter(doc => doc.id === this.document.id)
      .subscribe(doc => {
        console.log('POSTED', doc);
        this.document = doc;
        this.form.patchValue(this.document);
      });

  }

  ngOnDestroy() {
    if (this.afterPost$) { this.afterPost$.unsubscribe(); }
  }

  onSubmit() {
    const formDoc = this.form.value;
    const newDoc: DocModel = {
      id: this.document.id,
      type: this.document.type,
      date: formDoc.date,
      code: formDoc.code,
      description: formDoc.description,
      posted: true,
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
    this.ds.Post(newDoc);
  }

  handleOnCancel() {
    this.ds.onCancel(this.document);
    this.location.back();
    /*  this.router.navigate([this.docType]) */
  }

}

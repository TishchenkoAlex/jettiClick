import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { Observable } from 'rxjs/Observable';

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
  viewModel$: Observable<ViewModel>
  document: DocModel;
  form: FormGroup = new FormGroup({});
  controls: BaseDynamicControl<any>[] = [];

  controlsByKey: any = {};

  constructor(
    public fs: DynamicFormService, public ds: DocumentService,
    public router: Router, public location: Location) { }

  ngOnInit() {
    this.viewModel$ = this.fs.getControls(this.data.docType, this.data.docID)
      .do(viewModel => {
        this.document = viewModel.model;
        this.form = viewModel.formGroup;
        this.controlsByKey = viewModel.controlsByKey;
        this.controls = viewModel.view;
        this.ds.onChange(this.document)
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
      description: formDoc.description || this.document.description,
      posted: true,
      deleted: false,
      parent: '',
      isfolder: false,
      doc: {}
    }

    const exclude = ['id', 'code', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'date', 'description'];

    const process = (s, d) => {
      for (const property in s) {
        if (exclude.indexOf(property) > -1) { continue; }
        if (s[property] && typeof s[property] === 'object') {
          if (s[property].constructor === Array) {
            //
          } else {
            d.doc[property] = s[property]['id'] || null;
          }
        } else {
          d.doc[property] = s[property];
        }
      }
    }
    process(formDoc, newDoc);
    // this.ds.Post(newDoc);
    console.log(newDoc);
  }

  handleOnCancel() {
    this.ds.onCancel(this.document);
    this.location.back();
    /*  this.router.navigate([this.docType]) */
  }

}

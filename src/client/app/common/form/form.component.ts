import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { DynamicFormService, ViewModel } from '../dynamic-form/dynamic-form.service';
import { BaseDynamicControl } from '../dynamic-form/dynamic-form-base';
import { DynamicFormControlService } from '../dynamic-form/dynamic-form-control.service';
import { ApiService } from '../../services/api.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'common-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class CommonFromComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  value = '';
  controls: BaseDynamicControl<any>[];

  @Input() docType = '';
  @Input() docID = '';
  document: any = {};

  @Output() onDocLoaded = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<any>();

  constructor(
    private apiService: ApiService, private dfc: DynamicFormControlService,
    private dfs: DynamicFormService, private router: Router, private location: Location) {
  }

  ngOnInit() {

    this.dfs.getControls(this.docType, this.docID)
      .take(1)
      .subscribe((viewModel: ViewModel) => {
        this.controls = viewModel.view;
        this.document = viewModel.model;
        this.form = this.dfc.toFormGroup(this.controls);
        this.onDocLoaded.emit(this.document);
      });
  }

  onSubmit() {

    const formDoc = this.form.value;

    const newDoc = {
      id: this.document.id,
      type: this.document.type,
      date: formDoc.date,
      code: formDoc.code,
      description: formDoc.description,
      posted: false,
      deleted: false,
      parent: '',
      isfolder: false,
      doc: {
      }
    }

    const exclude = ['id', 'code', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'date', 'description'];
    Object.keys(formDoc).map((property) => {
      if (exclude.indexOf(property) > -1) { return; }
      if (typeof formDoc[property] === 'object') {
        newDoc.doc[property] = formDoc[property]['id'] || formDoc[property];
      } else {
        newDoc.doc[property] = formDoc[property];
      }
    });
    if (!newDoc['date']) { newDoc['date'] = this.document.date || new Date(); }
    if (!newDoc['description']) { newDoc['description'] =
      this.document.description || (newDoc['type'] + ' #' + newDoc['code'] + ' ' + newDoc['date'] + ''); };

    this.value = JSON.stringify(newDoc);

    this.apiService.postDoc(newDoc)
    .subscribe(posted => {
      this.form.patchValue(posted);
    });
  }

  handleOnCancel() {
    this.onCancel.emit(this.document);
    this.location.back();
/*     this.router.navigateByUrl(`${this.docType}`) */
  }
}

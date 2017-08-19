import { Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { DynamicFormService } from '../dynamic-form/dynamic-form.service';
import { FormGroup } from '@angular/forms';
import { BaseDynamicControl } from '../dynamic-form/dynamic-form-base';
import { DynamicFormControlService } from '../dynamic-form/dynamic-form-control.service';
import { ApiService } from '../../services/api.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Location } from '@angular/common';

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
      .subscribe(viewmodel => {
        this.controls = viewmodel.view;
        this.document = viewmodel.model;
        this.form = this.dfc.toFormGroup(this.controls);
        this.onDocLoaded.emit(this.document);
      });
  }

  onSubmit() {
    this.value = JSON.stringify(this.form.value);
  }

  handleOnCancel() {
    this.onCancel.emit(this.document);
    this.location.back();
/*     this.router.navigateByUrl(`${this.docType}`) */
  }
}

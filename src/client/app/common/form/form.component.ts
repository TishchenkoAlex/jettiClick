import { Observable } from 'rxjs/Rx';
import { DynamicFormService } from '../dynamic-form/dynamic-form.service';
import { FormGroup } from '@angular/forms';
import { BaseDynamicControl } from '../dynamic-form/dynamic-form-base';
import { DynamicFormControlService } from '../dynamic-form/dynamic-form-control.service';
import { ApiService } from '../../services/api.service';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'common-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [DynamicFormControlService]
})
export class CommonFromComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  value = '';
  controls: BaseDynamicControl<any>[];

  @Input() docType = '';
  @Input() docID = '';
  document: any = {};


  constructor(private apiService: ApiService, private dfc: DynamicFormControlService, private dfs: DynamicFormService) {
  }

  ngOnInit() {
    const mf = function (to, from) {
      // tslint:disable-next-line:forin
      for (const property in to) { to[property] = from[property]; }
      return to;
    };

    this.dfs.getControls(this.docType, this.docID)
      .take(1)
      .subscribe(viewmodel => {
        this.controls = viewmodel.view;
        this.document = viewmodel.model;
        this.form = this.dfc.toFormGroup(this.controls);
        const value = mf(this.form.value, this.document)
        this.form.setValue(value);
      });
  }

  onSubmit() {
    this.value = JSON.stringify(this.form.value);
  }
}

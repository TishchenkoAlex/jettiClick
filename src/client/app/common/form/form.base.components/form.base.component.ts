import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';

import { ViewModel } from '../../dynamic-form/dynamic-form.service';
import { ApiService } from '../../../services/api.service';
import { DocModel } from '../../../common/_doc.model';
import { DocumentComponent } from '../../../common/dynamic-component/dynamic-component';
import { TabControllerService } from '../../../common/tabcontroller/tabcontroller.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-form',
  templateUrl: './form.base.component.html',
})
export class BaseFormComponent implements DocumentComponent, OnInit {

  @Input() data;
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;
  viewModel: ViewModel;
  private _onPostSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private route: ActivatedRoute, private api: ApiService, private location: Location) { }

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;
  }

  Save() {
    console.log('BASE SAVE', this.viewModel);
    // this.onSubmit();
  }

  Cancel() {
    console.log('BASE CANCEL');
    this.location.back();
  }

  onSubmit() {
    console.log('BASE POST');
    const formDoc = this.viewModel.formGroup.value;
    const newDoc: DocModel = {
      id: this.viewModel.model.id,
      type: this.viewModel.model.type,
      date: formDoc.date,
      code: formDoc.code,
      description: formDoc.description || this.viewModel.model.description,
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
    if (!newDoc.date) { newDoc.date = new Date(); }
    this._onPostSubscription = this.api.postDoc(newDoc)
      .first()
      .subscribe((posted: DocModel) => {
        this.viewModel.model = posted;
        this.viewModel.formGroup.patchValue(posted);
      });
  }

}

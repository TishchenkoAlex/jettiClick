import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { ViewModel } from '../../dynamic-form/dynamic-form.service';
import { ApiService } from '../../../services/api.service';
import { DocModel } from '../../../common/_doc.model';
import { DocumentComponent } from '../../../common/dynamic-component/dynamic-component';
import { TableDynamicControl } from '../../../common/dynamic-form/dynamic-form-base';
import { DocService } from '../../../common/doc.service';

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

  constructor(private route: ActivatedRoute, private api: ApiService, private ds: DocService) { }

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;
  }

  Save() {
    this.onSubmit();
    this.ds.closeDoc(this.viewModel.model);
  }

  Cancel() {
    console.log('BASE CANCEL');
    this.ds.closeDoc(this.viewModel.model);
  }

  onSubmit() {
    console.log('BASE POST');
    const formDoc = this.viewModel.formGroup.getRawValue();
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

    const mapDoc = (s, d) => {
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
            return;
          }
          d.doc[property] = s[property] ? s[property]['id'] || s[property] : s[property] || null;
        }
      }
    }
    mapDoc(formDoc, newDoc);
    if (!newDoc.date) { newDoc.date = new Date(); }
    this._onPostSubscription = this.api.postDoc(newDoc)
      .take(1)
      .subscribe((posted: DocModel) => {
        this.viewModel.model = posted;
        this.viewModel.formGroup.patchValue(posted);
      });
  }

}

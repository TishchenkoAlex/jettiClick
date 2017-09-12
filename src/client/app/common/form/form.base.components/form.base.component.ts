import { ViewChild } from '@angular/core';
import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { MdTabGroup } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

import { DocModel } from '../../../common/_doc.model';
import { DocService } from '../../../common/doc.service';
import { DocumentComponent } from '../../../common/dynamic-component/dynamic-component';
import { ApiService } from '../../../services/api.service';
import { ViewModel } from '../../dynamic-form/dynamic-form.service';

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

  constructor(private route: ActivatedRoute, private api: ApiService, private ds: DocService) { }

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;

    this.ds.save$
    .filter(doc => doc.id === this.viewModel.model.id)
    .subscribe((savedDoc: DocModel) => {
      this.viewModel.model = savedDoc;
      this.viewModel.formGroup.patchValue(savedDoc);
    });

    this.ds.delete$
    .filter(doc => doc.id === this.viewModel.model.id)
    .subscribe((deletedDoc: DocModel) => {
      this.viewModel.model = deletedDoc;
      this.viewModel.formGroup.patchValue(deletedDoc);
    });

  }

  Save() {
    console.log('BASE SAVE');
    this.onSubmit();
  }

  PostClose() {
    this.Post();
    this.Close()
  }

  Post() {
    this.viewModel.model.posted = true;
    this.onSubmit();
  }

  unPost() {
    this.viewModel.model.posted = false;
    this.onSubmit();
  }

  Delete() {
    this.ds.delete(this.viewModel.model.id);
  }

  Close() {
    console.log('BASE CLOSE');
    this.ds.close(this.viewModel.model);
  }

  onSubmit() {
    const formDoc = this.viewModel.formGroup.getRawValue();
    const newDoc: DocModel = {
      id: this.viewModel.model.id,
      type: this.viewModel.model.type,
      date: formDoc.date,
      code: formDoc.code,
      description: formDoc.description || this.viewModel.model.description,
      posted: this.viewModel.model.posted,
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
          } else {
            d.doc[property] = s[property] ? s[property]['id'] || s[property] : s[property] || null;
          }
        }
      }
    }
    mapDoc(formDoc, newDoc);
    if (!newDoc.date) { newDoc.date = new Date(); }
    this.ds.save(newDoc);
  }

}

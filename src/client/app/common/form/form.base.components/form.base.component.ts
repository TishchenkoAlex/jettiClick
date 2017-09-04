import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { DocumentComponent } from '../../dynamic-component/document.component';
import { DocumentService } from '../../dynamic-component/document.service';
import { ViewModel } from '../../dynamic-form/dynamic-form.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-form',
  templateUrl: './form.base.component.html',
})
export class BaseFormComponent implements DocumentComponent, OnInit {

  @Input() data;
  @Input() userTepmlate: TemplateRef<any>;
  viewModel: ViewModel;

  constructor (private route: ActivatedRoute, private ds: DocumentService, private location: Location ) {}

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;
  }

  onSubmit() {
    this.ds.Post(this.viewModel);
  }

  handleOnCancel() {
      this.location.back();
  }
}

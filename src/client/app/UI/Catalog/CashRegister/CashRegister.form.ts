import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormGroup } from '@angular/forms';
import { DocModel } from '../../../common/_doc.model';
import { ApiService } from '../../../services/api.service';
import { DocumentComponent } from '../../../common/dynamic-component/document.component';
import { DynamicFormService, ViewModel } from '../../../common/dynamic-form/dynamic-form.service';
import { DocumentService } from '../../../common/dynamic-component/document.service';
import { UserFormComponent } from '../../../UI/userForm.component';


@Component({
  // tslint:disable-next-line:component-selector
  templateUrl: 'CashRegister.form.html',
  styleUrls: ['CashRegister.form.scss']
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm extends UserFormComponent implements OnInit {

  result: DocModel;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private documentService: DocumentService) {
      super(apiService, router, documentService);
    }

  ngOnInit() {
    super.ngOnInit();
  }

  onSubmit(form: NgForm) {
    this.result = super.getDocForPost(form);
  }
}

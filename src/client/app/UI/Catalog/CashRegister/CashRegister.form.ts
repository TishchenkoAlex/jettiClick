import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DocService } from '../../../common/doc.service';
import { ViewModel } from '../../../common/dynamic-form/dynamic-form.service';

@Component({
  templateUrl: 'CashRegister.form.html',
})
// tslint:disable-next-line:component-class-suffix
export class CashRegisterForm {
  viewModel: ViewModel;

  constructor(public route: ActivatedRoute, public docService: DocService) {
    this.viewModel = this.route.data['value'].detail;
  }

  Save() {
    console.log('BASE SAVE');
    this.onSubmit();
  }

  private onSubmit() {
    this.viewModel.model = Object.assign(this.viewModel.model, this.viewModel.formGroup.value);
    this.docService.save(this.viewModel.model);
  }

  Close() {
    console.log('BASE CLOSE');
    this.docService.close(this.viewModel.model);
  }
}

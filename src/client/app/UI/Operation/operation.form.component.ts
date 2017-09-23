import { DocService } from '../../common/doc.service';
import { SideNavService } from '../../services/side-nav.service';
import { getViewModel, ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { Component, OnInit } from '@angular/core';

import { BaseFormComponent } from '../../common/form/form.base.components/form.base.component';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: 'operation.form.component.html',
})
export class OperationFormComponent extends BaseFormComponent implements OnInit {
  additionalVM: ViewModel;

  ngOnInit() {
    super.ngOnInit();
    this.buildForm(this.viewModel);
    console.log('CHILD INIT');
  }

  Save() {
    console.log('CHILD SAVE');
    super.Save();
  }

  buildForm(viewModel: ViewModel) {
    const result = {
      d1: { label: 'Kасса', type: 'Catalog.CashRegister' },
      k1: { label: 'Подотчетный', type: 'Catalog.Manager' },
    }
    this.additionalVM = getViewModel(result, viewModel.model, [], true);
    Object.keys(this.additionalVM.formGroup.controls)
      .forEach(c => this.viewModel.formGroup.addControl(c, this.additionalVM.formGroup.get(c)));
    this.viewModel.view = [...this.viewModel.view, ...this.additionalVM.view];
  }

}

import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

import { BaseJettiFromControl } from '../../common/dynamic-form/dynamic-form-base';
import { getViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { BaseFormComponent } from '../../common/form/form.base.components/form.base.component';

@Component({
  templateUrl: 'operation.form.component.html',
  styleUrls: ['../../common/form/form.base.components/form.base.component.scss'],
})
export class OperationFormComponent extends BaseFormComponent implements OnInit {

  private _countOfControls = 0;

  ngOnInit() {
    super.ngOnInit();
    this._countOfControls = this.viewModel.view.length;
    this.addParametersToForm();
    console.log('CHILD INIT');
    this.viewModel.formGroup.controls['Operation'].valueChanges.subscribe(value => {
      this.addParametersToForm();
    });
  }

  addParametersToForm() {
    this.viewModel.view.length = this._countOfControls;
    this.docService.api.getViewModel('Catalog.Operation',
      this.viewModel.formGroup.controls['Operation'].value.id)
      .take(1)
      .subscribe(data => {
        const Parameters = data['model']['Parameters'] as any[];
        const ParametersObject: { [s: string]: any } = {};
        let index = 1; Parameters.forEach(c =>
          ParametersObject['p' + index++] = {
            label: c.label, type: c.type.id, required: !!c.required, ['p' + (index - 1) ]: c.change ? JSON.parse(c.change) : null
          });

        const additionalVM = getViewModel(ParametersObject, this.viewModel.model, [], true);
        Object.keys(additionalVM.formGroup.controls).forEach(c => {
          const additionalControl = additionalVM.formGroup.get(c) as FormControl;
          if (additionalControl.value && additionalControl.value.type === null) {
            additionalControl.patchValue(
              { id: '', value: '', type: ParametersObject[c].type, code: '' },
              { onlySelf: true, emitEvent: false });
          }
          this.viewModel.formGroup.removeControl(c);
          this.viewModel.formGroup.addControl(c, additionalControl);
        });
        this.viewModel.view = [...this.viewModel.view, ...additionalVM.view];
        let i = 1; this.viewModel.view.forEach(e => e.order = i++);
      });
  }
}

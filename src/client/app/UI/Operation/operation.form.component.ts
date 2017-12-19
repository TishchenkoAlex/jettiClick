import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { take } from 'rxjs/operators';

import { BaseJettiFromControl } from '../../common/dynamic-form/dynamic-form-base';
import { getViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { BaseFormComponent } from './../../common/form/base.form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<j-form [formTepmlate]="" [actionTepmlate]="">
  </j-form>`
})
export class OperationFormComponent implements AfterViewInit {

  private _originalView: BaseJettiFromControl<any>[] = [];

  @ViewChild(BaseFormComponent) super: BaseFormComponent;
  get viewModel() { return this.super.viewModel }

  ngAfterViewInit() {
    this._originalView = [...this.viewModel.view];
    this.addParametersToForm();
    this.viewModel.formGroup.controls['Operation'].valueChanges.subscribe(() => this.addParametersToForm());
  }

  addParametersToForm() {
    this.viewModel.view = [...this._originalView];
    const OperationId = this.viewModel.formGroup.controls['Operation'].value.id;
    if (!OperationId) { return }
    this.super.ds.api.getViewModel('Catalog.Operation', OperationId).pipe(
      take(1))
      .subscribe(data => {
        const Parameters = data['model']['Parameters'] || [] as any[];
        const ParametersObject: { [s: string]: any } = {};
        Parameters.forEach(c =>
          ParametersObject['p' + c.order] = {
            label: c.label, type: c.type.id, required: !!c.required, change: c.change, order: c.order,
            ['p' + c.order]: c.tableDef ? JSON.parse(c.tableDef) : null
          });
        for (let fc = 1; fc <= 10; fc++) { this.viewModel.formGroup.removeControl('p' + fc); }
        const additionalVM = getViewModel(ParametersObject, this.viewModel.model, true);
        additionalVM.view.filter(el => el.order > 0).forEach(el => el.order = el.order + 103);
        Object.keys(additionalVM.formGroup.controls).forEach(c => {
          const additionalControl = additionalVM.formGroup.get(c) as FormControl;
          if ((additionalControl.value && additionalControl.value.type === null) || !additionalControl.value) {
            const type: string = ParametersObject[c].type;
            if (type.includes('.')) {
              additionalControl.patchValue(
                { id: '', value: null, type: type, code: '' }, { onlySelf: true, emitEvent: false });
            }
          }
          this.viewModel.formGroup.addControl(c, additionalControl);
        });
        this.viewModel.view.push.apply(this.viewModel.view, additionalVM.view);
        this.viewModel.view = [...this.viewModel.view.filter(el => el.order > 0), ...this.viewModel.view.filter(el => el.order <= 0)];
        this.super.cd.markForCheck();
      });
  }

}

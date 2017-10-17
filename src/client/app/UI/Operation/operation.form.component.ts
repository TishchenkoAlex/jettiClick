import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DocService } from '../../common/doc.service';
import { getViewModel, ViewModel } from '../../common/dynamic-form/dynamic-form.service';

@Component({
  templateUrl: 'operation.form.component.html',
  styleUrls: ['../../common/form/form.base.components/form.base.component.scss'],
})
export class OperationFormComponent implements OnInit {

  viewModel: ViewModel;
  private _countOfControls = 0;

  constructor(public route: ActivatedRoute, public docService: DocService) { }

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;
    this._countOfControls = this.viewModel.view.length;
    this.addParametersToForm();
    console.log('CHILD INIT');
    this.viewModel.formGroup.controls['Operation'].valueChanges
      .subscribe(value => this.addParametersToForm());

  }

  addParametersToForm() {
    this.viewModel.view.length = this._countOfControls;
    this.docService.api.getViewModel('Catalog.Operation',
      this.viewModel.formGroup.controls['Operation'].value.id)
      .take(1)
      .subscribe(data => {
        const Parameters = data['model']['Parameters'] as any[];
        const ParametersObject: { [s: string]: any } = {};
        Parameters.forEach(c =>
          ParametersObject['p' + c.order] = {
            label: c.label, type: c.type.id, required: !!c.required, change: c.change, order: c.order,
            ['p' + c.order]: c.tableDef ? JSON.parse(c.tableDef) : null
          });

        const additionalVM = getViewModel(ParametersObject, this.viewModel.model, [], true);
        Object.keys(additionalVM.formGroup.controls).forEach(c => {
          const additionalControl = additionalVM.formGroup.get(c) as FormControl;
          if ((additionalControl.value && additionalControl.value.type === null) || !additionalControl.value) {
            const type: string = ParametersObject[c].type;
            if (type.includes('.')) {
              additionalControl.patchValue(
                { id: '', value: null, type: type, code: '' }, { onlySelf: true, emitEvent: false });
            }
          }
          this.viewModel.formGroup.removeControl(c);
          this.viewModel.formGroup.addControl(c, additionalControl);
        });
        this.viewModel.view.push.apply(this.viewModel.view, additionalVM.view);
      });
  }

}

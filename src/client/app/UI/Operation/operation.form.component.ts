import { FormControl } from '@angular/forms';
import { DocModel } from '../../common/doc.model';
import { DocService } from '../../common/doc.service';
import { SideNavService } from '../../services/side-nav.service';
import { getViewModel, ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { Component, OnInit } from '@angular/core';

import { BaseFormComponent } from '../../common/form/form.base.components/form.base.component';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: 'operation.form.component.html',
  styleUrls: ['../../common/form/form.base.components/form.base.component.scss'],
})
export class OperationFormComponent extends BaseFormComponent implements OnInit {

  ngOnInit() {
    super.ngOnInit();
    this.addParametersToForm(this.viewModel);
    console.log('CHILD INIT');
  }

  Save() {
    console.log('CHILD SAVE');
    super.Save();
  }

  addParametersToForm(viewModel: ViewModel) {
    this.docService.api.getViewModel('Catalog.Operation', viewModel.model['Operation'].id).subscribe(data => {
      const Parameters = data['model']['Parameters'] as any[];

      const ParametersObject: { [s: string]: any } = {};
      let index = 1; Parameters.forEach(c =>
        ParametersObject['p' + index++] = { label: c.label, type: c.type.id, required: !!c.required });

      const additionalVM = getViewModel(ParametersObject, viewModel.model, [], true);
      Object.keys(additionalVM.formGroup.controls).forEach(c => {
        const additionalControl = additionalVM.formGroup.get(c) as FormControl;
        if (!additionalControl.value.type) {
          additionalControl.patchValue(
            {id: '', value: '', type: ParametersObject[c].type, code: ''},
            {onlySelf: true, emitEvent: false });
        }
        this.viewModel.formGroup.setControl(c, additionalControl);
      });
      this.viewModel.view = [...this.viewModel.view, ...additionalVM.view];
      let i = 1; this.viewModel.view.forEach(e => e.order = i++);
    });
  }
}

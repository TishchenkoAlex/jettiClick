import { Component, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MD_DIALOG_DATA } from '@angular/material';

import { BaseJettiFromControl } from '../common/dynamic-form/dynamic-form-base';

@Component({
  templateUrl: './table-parts.dialog.component.html',
  styles: [``],
})
export class TablePartsDialogComponent {

  formGroup: FormGroup;
  controls: BaseJettiFromControl<any>[];

  constructor(@Inject(MD_DIALOG_DATA) public data: any) {
    this.formGroup = data.formGroup;
    this.controls = data.view;
  }

}
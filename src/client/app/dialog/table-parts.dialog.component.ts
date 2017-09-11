import { Component, Inject } from '@angular/core';
import { MD_DIALOG_DATA } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { BaseDynamicControl } from '../common/dynamic-form/dynamic-form-base';

@Component({
  templateUrl: './table-parts.dialog.component.html',
  styles: [``],
})
export class TablePartsDialogComponent {

  formGroup: FormGroup;
  controls: BaseDynamicControl<any>[];

  constructor(@Inject(MD_DIALOG_DATA) public data: any) {
    this.formGroup = data.formGroup;
    this.controls = data.view;
  }

}

import { Component, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';

import { BaseJettiFromControl } from '../common/dynamic-form/dynamic-form-base';

@Component({
  templateUrl: './table-parts.dialog.component.html',
  styles: [``],
})
export class TablePartsDialogComponent {

  formGroup: FormGroup;
  controls: BaseJettiFromControl<any>[];

  constructor(public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.formGroup = data.formGroup;
    this.controls = data.view;
    this.controls.forEach(el => el.order += 10000);

    const isTableDef =
      this.formGroup.controls['type'] &&
      this.formGroup.controls['type'].value &&
      this.formGroup.controls['type'].value.id === 'table';

    const tableDefControl = this.controls[this.controls.findIndex(el => el.key === 'tableDef')];
    if (tableDefControl) { tableDefControl.hidden = !isTableDef; }
  }
}

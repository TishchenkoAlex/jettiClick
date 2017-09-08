import { Component, Inject } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { ViewModel } from '../common/dynamic-form/dynamic-form.service';
import { FormGroup } from '@angular/forms';
import { BaseDynamicControl } from '../common/dynamic-form/dynamic-form-base';

@Component({
  templateUrl: './dialog.component.html',
  styles: [``]
})
export class DialogComponent {

  formGroup: FormGroup;
  controls: BaseDynamicControl<any>[];

  constructor(public dialogRef: MdDialogRef<DialogComponent>, @Inject(MD_DIALOG_DATA) public data: any) {
    this.formGroup = data.formGroup;
    this.controls = data.view;
  }
}

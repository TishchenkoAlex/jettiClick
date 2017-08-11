import { Component, Inject } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

@Component({
  templateUrl: './dialog.component.html'
})
export class DialogComponent {

  constructor(public dialogRef: MdDialogRef<DialogComponent>, @Inject(MD_DIALOG_DATA) public data: any) {
  }
}

import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DocModel } from '../../_doc.model';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-form-actions',
  template: `
<div *ngIf="formGroup">
  <button md-raised-button color="warn" [disabled]="!formGroup.valid" (click)="cmdPost.emit()">Save</button>
  <button md-raised-button type="button" (click)="cmdCancel.emit()">Cancel</button>
</div>`
})
export class CommonFormActionsComponent implements OnInit {
  @Input() formGroup: FormGroup;
  @Output() cmdCancel = new EventEmitter();
  @Output() cmdSave = new EventEmitter();
  @Output() cmdPost = new EventEmitter();
  @Output() cmdDelete = new EventEmitter();

  ngOnInit() {

  }
}

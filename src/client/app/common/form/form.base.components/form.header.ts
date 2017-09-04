import { DocModel } from '../../_doc.model';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-form-header',
  template: `
<div *ngIf="model">
    <div fxLayoutAlign="start space-between" class="mat-card" style="height: 50px">
      <div fxLayout="row" fxFlex>
        <md-card-title fxLayout="row" fxLayoutAlign="start center">
          <md-icon *ngIf="model.deleted" color="warn">indeterminate_check_box</md-icon>
          <md-icon *ngIf="model.posted" color="primary">check_box</md-icon>
          <md-icon *ngIf="!model.posted && !model.deleted" color="accent">check_box_outline_blank</md-icon>
          <span style="margin-left: 10px">{{ model.description }}</span>
        </md-card-title>
      </div>
      <md-card-subtitle style="font-size: 9pt">{{ model.date | date:'medium' }}</md-card-subtitle>
    </div>
</div>`
})
export class CommonFormHeaderComponent implements OnInit {
  @Input() model: DocModel;

  ngOnInit() {

  }
}

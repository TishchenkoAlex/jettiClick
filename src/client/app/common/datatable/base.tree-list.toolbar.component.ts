import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MenuItem, TreeNode } from 'primeng/primeng';

import { BaseTreeListComponent } from '../../common/datatable/base.tree-list.component';

// tslint:disable:max-line-length
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-tree-list-toolbar',
  template: `
    <p-toolbar>
      <div class="ui-toolbar-group-left">
        <span *ngFor="let btn of buttons">
          <button *ngIf="btn.visible" pButton type="button" [ngClass]="btn.styleClass" [icon]="btn.icon" (click)="btn.command()"></button>
        </span>
        <ng-content></ng-content>
      </div>
    </p-toolbar>`
})
export class BaseTreeListToolbarComponent implements OnInit {
  @Input() owner: BaseTreeListComponent;

  private _selection: TreeNode = null;
  get selection(): TreeNode { return this._selection; }
  @Input() set selection(value: TreeNode) {
    this._selection = value;
    this.recalcButtonsState();
  }

  buttons: MenuItem[] = [];
  ngOnInit() {
    this.buttons = [
      { label: 'add', icon: 'fa-plus', styleClass: 'ui-button-success', command: this.owner.add.bind(this.owner), visible: true },
      { label: 'delete', icon: 'fa-trash', styleClass: 'ui-button-danger', command: this.owner.delete.bind(this.owner), visible: this.selection !== null },
    ];
  }

  private recalcButtonsState() {
      // tslint:disable-next-line:no-non-null-assertion
      this.buttons.find(b => b.label === 'delete')!.visible = this.selection !== null;
  }

}

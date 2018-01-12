import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MenuItem, TreeNode } from 'primeng/primeng';

import { BaseTreeListComponent } from '../../common/datatable/base.tree-list.component';
import { LoadingService } from './../../common/loading.service';

// tslint:disable:max-line-length
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-tree-list-toolbar',
  template: `
    <p-toolbar>
      <div class="ui-toolbar-group-left">
        <span *ngFor="let btn of buttons">
          <button *ngIf="btn.visible" pButton type="button" [ngClass]="btn.styleClass" [icon]="btn.icon"
            (click)="btn.command()" [disabled]="lds.loading$ | async"></button>
        </span>
        <ng-content></ng-content>
      </div>
    </p-toolbar>`
})
export class BaseTreeListToolbarComponent {
  @Input() owner: BaseTreeListComponent;

  private _selectedNode: TreeNode = null;
  get selection(): TreeNode { return this._selectedNode; }
  @Input() set selection(value: TreeNode) {
    this._selectedNode = value;
    this.buttons = this._buttons();
  }

  buttons: MenuItem[] = [];

  constructor(public lds: LoadingService) { }

  private _buttons(): MenuItem[] {
    return [
      { label: 'add', icon: 'fa-plus', styleClass: 'ui-button-success', command: this.owner.add.bind(this.owner), visible: true },
      { label: 'copy', icon: 'fa-copy', command: this.owner.copy.bind(this.owner), visible: this.selection !== null },
      { label: 'delete', icon: 'fa-minus', styleClass: 'ui-button-danger', command: this.owner.delete.bind(this.owner), visible: this.selection !== null },
    ];
  }

}

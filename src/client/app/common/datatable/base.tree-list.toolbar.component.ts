import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, TreeNode } from 'primeng/primeng';

import { ApiDataSource } from './../../common/datatable/api.datasource.v2';
import { DocService } from './../../common/doc.service';
import { LoadingService } from './../../common/loading.service';
import { BaseTreeListComponent } from '../../common/datatable/base.tree-list.component';

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
  @Input() userButtons: MenuItem[] = [];
  @Input() owner: BaseTreeListComponent;

  private _selectedNode: TreeNode = null;
  get selection(): TreeNode { return this._selectedNode; }
  @Input() set selection(value: TreeNode) {
    console.log('buttons-tree');
    this._selectedNode = value;
    this.buttons = this._buttons();
  }

  buttons: MenuItem[] = [];

  constructor(public router: Router, public ds: DocService, public lds: LoadingService) { }

  add = () => this.router.navigate([this.owner.docType, 'new']);

  copy = () => this.router.navigate([this.owner.docType, 'copy-' + this.selection.data.id]);

  open = () => this.router.navigate([this.owner.docType, this.selection.data.id]);

  delete = () => this.ds.delete(this.selection.data.id);

  private _buttons(): MenuItem[] {
    return [
      { label: 'add', icon: 'fa-plus', styleClass: 'ui-button-success', command: this.add.bind(this), visible: true },
      { label: 'copy', icon: 'fa-copy', command: this.copy.bind(this), visible: this.selection !== null },
      { label: 'delete', icon: 'fa-minus', styleClass: 'ui-button-danger', command: this.delete.bind(this), visible: this.selection !== null },
      ...this.userButtons
    ];
  }

}

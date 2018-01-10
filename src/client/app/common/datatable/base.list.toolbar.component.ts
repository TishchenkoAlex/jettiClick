import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/primeng';

import { DocumentBase } from '../../../../server/models/document';
import { DocTypes } from '../../../../server/models/documents.types';
import { DocService } from './../../common/doc.service';
import { LoadingService } from './../../common/loading.service';
import { ApiDataSource } from '../../common/datatable/api.datasource.v2';

// tslint:disable:max-line-length
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-list-toolbar',
  template: `
    <p-toolbar>
      <div class="ui-toolbar-group-left">
        <span *ngFor="let btn of buttons">
          <button *ngIf="btn.visible" pButton type="button" [ngClass]="btn.styleClass" [icon]="btn.icon"
            (click)="btn.command()" [disabled]="lds.loading$ | async"></button>
        </span>
        <ng-content></ng-content>
      </div>
      <div class="ui-toolbar-group-right">
        <button pButton type="button" icon="fa-fast-backward" (click)="owner.dataSource?.first()" [disabled]="!owner.dataSource?.continuation?.first"></button>
        <button pButton type="button" icon="fa-step-backward" (click)="owner.dataSource?.prev()" [disabled]="!owner.dataSource?.continuation?.first"></button>
        <button pButton type="button" icon="fa-step-forward" (click)="owner.dataSource?.next()" [disabled]="!owner.dataSource?.continuation?.last"></button>
        <button pButton type="button" icon="fa-fast-forward" (click)="owner.dataSource?.last()" [disabled]="!owner.dataSource?.continuation?.last"></button>
        <button pButton type="button" icon="fa-close" class="ui-button-danger" (click)="close()" [disabled]="lds.loading$ | async"></button>
      </div>
    </p-toolbar>`
})
export class BaseDocListToolbarComponent {
  @Input() owner: any;
  @Input() userButtons: MenuItem[] = [];
  get dataSource(): ApiDataSource { return this.owner.dataSource; }

  private _selection: DocumentBase[] = null;
  get selection(): DocumentBase[] { return this._selection; }
  @Input() set selection(value: DocumentBase[]) {
    console.log('buttons-list');
    this._selection = value;
    this.buttons = this._buttons();
  }

  buttons: MenuItem[] = [];

  constructor(public router: Router, public ds: DocService, public lds: LoadingService) { }

  private _buttons(): MenuItem[] {
    console.log('buttons-list');
    const length = this.dataSource && this.dataSource.dataTable && this.dataSource.dataTable.selection ? this.dataSource.dataTable.selection.length : 0;
    const isDoc = this.owner.dataSource.docType.startsWith('Document.');
    return [
      { label: 'add', icon: 'fa-plus', styleClass: 'ui-button-success', command: this.add.bind(this), visible: true },
      { label: 'open', icon: 'fa-pencil-square-o', command: this.open.bind(this), visible: length === 1 },
      { label: 'copy', icon: 'fa-copy', command: this.copy.bind(this), visible: length > 0 },
      { label: 'post', icon: 'fa-check-square', styleClass: 'ui-button-secondary', command: this.post.bind(this, 'post'), visible: length >= 1 && isDoc},
      { label: 'unpost', icon: 'fa-square-o', styleClass: 'ui-button-secondary', command: this.post.bind(this, 'unpost'), visible: length >= 1 && isDoc},
      { label: 'delete', icon: 'fa-minus', styleClass: 'ui-button-danger', command: this.delete.bind(this), visible: length > 0 },
      { label: 'refresh', icon: 'fa-refresh', command: this.dataSource ? this.dataSource.refresh.bind(this.dataSource) : () => { }, visible: true },
      ...this.userButtons
    ];
  }

  close() { this.ds.close(null); }

  add() {
    this.router.navigate([this.owner.dataSource.dataTable.selection[0] ?
      this.owner.dataSource.dataTable.selection[0].type : this.owner.dataSource.docType, 'new']);
  }

  copy() { this.router.navigate([this.owner.dataSource.dataTable.selection[0].type, 'copy-' + this.owner.dataSource.dataTable.selection[0].id]); }

  copyTo(type: DocTypes) { this.router.navigate([type, 'base-' + this.owner.dataSource.dataTable.selection[0].id]); }

  open() { this.router.navigate([this.owner.dataSource.dataTable.selection[0].type, this.owner.dataSource.dataTable.selection[0].id]); }

  delete() { this.owner.dataSource.dataTable.selection.forEach(el => this.ds.delete(el.id)); }

  async post(mode = 'post') {
    const tasksCount = this.owner.dataSource.dataTable.selection.length; let i = tasksCount;
    for (const s of this.owner.dataSource.dataTable.selection) {
      this.lds.counter = Math.round(100 - ((--i) / tasksCount * 100));
      try {
        if (mode === 'post') { await this.ds.post(s.id); } else { await this.ds.unpost(s.id); }
      } catch (err) {
        this.ds.openSnackBar('error', 'Error on post ' + s.description, err.message);
      }
    }
    this.lds.counter = 0;
    this.owner.dataSource.refresh();
  }

}

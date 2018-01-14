import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OnInit } from '@angular/core';
import { TreeNode } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { map, share, take, tap } from 'rxjs/operators';

import { ITree } from '../../../../server/models/api';
import { DocTypes } from '../../../../server/models/documents.types';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { DocService } from '../../common/doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-tree-list',
  template: `
    <div style="width: 250px" >
      <j-tree-list-toolbar [owner]="this" [selection]="selection"></j-tree-list-toolbar>
      <p-treeTable [value]="treeNodes$ | async"
        selectionMode="single" [(selection)]="selection" (selectionChange)="onSelectionChange($event)">
          <p-column field="description" header="hierarchy" [filter]="true" filterPlaceholder="Search">
          <ng-template let-row="rowData" pTemplate="body">
          <span draggable [dragScope]="'docs'" [dragData]="row"
            (onDrop)="onDragEnd($event)" droppable [dropScope]="'docs'" [dragOverClass]="'drag-target-border'">
            {{ row.data.description }}
          </span>
          </ng-template>
          </p-column>
      </p-treeTable>
    </div>`,
})
export class BaseTreeListComponent implements OnInit {
  @Output() selectionChange = new EventEmitter();
  @Input() docType: DocTypes;
  treeNodes$: Observable<TreeNode[]>;
  selection: TreeNode = null;

  constructor(private api: ApiService, public router: Router,  public ds: DocService) { }

  ngOnInit() {
    this.treeNodes$ = this.load$().pipe(tap(data => this.selection = data[0]), share());
  }

  private load$() {
    return this.api.tree(this.docType).pipe(map(tree => <TreeNode[]>[{
      label: '(All)',
      data: { id: null, description: '(All)' },
      expanded: true,
      expandedIcon: 'fa-folder-open',
      collapsedIcon: 'fa-folder',
      children: this.buildTreeNodes(tree),
    }]));
  }

  private buildTreeNodes(tree: ITree[], parent = null): TreeNode[] {
    return tree.filter(el => el.parent === parent).map(el => {
      return <TreeNode>{
        label: el.description,
        data: { id: el.id, description: el.description },
        expanded: true,
        expandedIcon: 'fa-folder-open',
        collapsedIcon: 'fa-folder',
        children: this.buildTreeNodes(tree, el.id) || [],
      };
    });
  }

  add = () =>  this.router.navigate([this.docType, 'folder-'  + this.selection.data.id]);
  copy = () => this.router.navigate([this.docType, 'copy-'    + this.selection.data.id]);
  open = () => this.router.navigate([this.docType, this.selection.data.id]);
  delete = () => this.ds.delete(this.selection.data.id);
  onSelectionChange = (event) => this.selectionChange.emit(event);

  onDragEnd(event) {
    console.log('drop', event);
  }

}

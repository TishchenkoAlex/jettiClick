import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OnInit } from '@angular/core';
import { TreeNode } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { map, share } from 'rxjs/operators';

import { ITree } from '../../../../server/models/api';
import { DocTypes } from '../../../../server/models/documents.types';
import { ApiService } from '../../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-tree-list',
  template: `
    <div style="width: 300px" pDroppable="docs" (onDrop)="nodeDrop($event)">
      <j-tree-list-toolbar [owner]="this" [selection]="selection"></j-tree-list-toolbar>
      <p-treeTable [value]="treeNodes$ | async"
        selectionMode="single" [(selection)]="selection" (selectionChange)="onSelectionChange($event)">
          <p-column field="description" header="hierarchy" [filter]="true" filterPlaceholder="Search">
          <ng-template let-row="rowData" pTemplate="body">
          <span pDraggable="docs">
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

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.treeNodes$ = this.load$();
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

  onSelectionChange = (event) => this.selectionChange.emit(event);

  nodeDrop(event) {

  }
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TreeNode } from 'primeng/components/common/treenode';
// tslint:disable-next-line:import-blacklist
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { v1 } from 'uuid';

import { ITree } from '../../../../server/models/api';
import { DocTypes } from '../../../../server/models/documents.types';
import { DocService } from '../../common/doc.service';
import { ApiService } from '../../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-tree-list',
  template: `
    <div style="width: 220px" >
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
  selection: TreeNode;

  constructor(private api: ApiService, public router: Router, public ds: DocService) { }

  ngOnInit() {
    this.treeNodes$ = this.load$().pipe(tap(data => this.selection = data[0]));
  }

  private load$() {
    return this.api.tree(this.docType).pipe(map(tree => <TreeNode[]>[{
      label: '(All)',
      data: { id: null, description: '(All)' },
      expanded: true,
      expandedIcon: 'fa-folder-open',
      collapsedIcon: 'fa-folder',
      children: this.buildTreeNodes(tree, null),
    }]));
  }

  private buildTreeNodes(tree: ITree[], parent: string | null): TreeNode[] {
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

  add() {
    const id = v1();
    this.router.navigate([this.docType, id],
      { queryParams: { new: id, isfolder: true, parent: this.selection.data.id } });
  }

  copy() {
    const id = v1();
    this.router.navigate([this.docType, id],
      { queryParams: { copy: this.selection.data.id, isfolder: true, parent: this.selection.data.id } });
  }

  open = () => this.router.navigate([this.docType, this.selection.data.id], { queryParams: {} });
  delete = () => this.ds.delete(this.selection.data.id);

  onSelectionChange(event) {
    this.selectionChange.emit(event);
  }

  onDragEnd(event) {
    // console.log('drop', event);
  }

}

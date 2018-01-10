import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';

import { BaseDocListComponent } from './../../common/datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'calatog-list.component.html'
})
export class CatalogListComponent implements OnInit {
  @ViewChild('list') super: BaseDocListComponent;

  ngOnInit() {
    this.super.ds.api.tree(this.super.docType);
  }

}

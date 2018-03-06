import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Column } from 'primeng/components/common/shared';
import { DataTable } from 'primeng/components/datatable/datatable';

import { DocumentOptions } from '../../../server/models/document';
import { createDocument } from '../../../server/models/documents.factory';
import { FormListFilter } from '../../../server/models/user.settings';
import { ApiDataSource } from '../common/datatable/api.datasource.v2';
import { ApiService } from '../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-suggest-list',
  templateUrl: './suggest.dialog.component.html'
})
export class SuggestDialogComponent implements OnInit, AfterViewInit {

  dataSource: ApiDataSource | null = null;
  private _afterViewInit = false;

  @Input() pageSize = 15; @Input() type = ''; @Input() id = ''; @Input() filters: FormListFilter[] = [];
  @Output() Select = new EventEmitter();
  @ViewChild(DataTable) dataTable: DataTable = null;

  isDoc: boolean; additianalColumn1 = ''; additianalColumn2 = '';

  constructor(private apiService: ApiService, private elementRef: ElementRef) { }

  ngOnInit() {
    this.isDoc = this.type.startsWith('Document.') || this.type.startsWith('Journal.');
    this.dataSource = new ApiDataSource(this.apiService, this.type, this.pageSize);
    const doc = createDocument(this.type as any);
    if (doc) {
      setTimeout(() => {
        const data = (doc.Prop() as DocumentOptions).dimensions || [];
        if (data.length > 0) { this.additianalColumn1 = Object.keys(data[0])[0]; }
        if (data.length > 1) { this.additianalColumn2 = Object.keys(data[1])[0]; }
      });
    }
  }

  ngAfterViewInit() {
    this.dataSource.dataTable = this.dataTable;
    setTimeout(() => {
      this.dataTable.columns.forEach(c => this.dataTable.filters[c.field] = { matchMode: '=', value: null });
      this.filters.filter(f => f.right).forEach(f => this.dataTable.filters[f.left] = { matchMode: f.center, value: f.right });
      this.dataSource.goto(this.id);
      this._afterViewInit = true;
    });
  }

  update(col: Column, event) {
    if (!event || (event && !event.value)) { event = null; }
    this.dataTable.filters[col.field] = { matchMode: col.filterMatchMode, value: event };
    this.Sort(event);
  }

  Sort = (event) => { if (this._afterViewInit) { this.dataSource.sort(); } };
  onSelectHandler = (row) => this.Select.emit(row);

}

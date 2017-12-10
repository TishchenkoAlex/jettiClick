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
import { Column, DataTable } from 'primeng/primeng';
import { take } from 'rxjs/operators';

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

  @Input() pageSize = 15; @Input() docType = ''; @Input() docID = ''; @Input() filters: FormListFilter[] = [];
  @Output() onSelect = new EventEmitter();
  @ViewChild(DataTable) dataTable: DataTable = null;

  isDoc: boolean; additianalColumn1 = ''; additianalColumn2 = '';

  constructor(private apiService: ApiService, private elementRef: ElementRef) { }

  ngOnInit() {
    this.isDoc = this.docType.startsWith('Document.') || this.docType.startsWith('Journal.');
    this.dataSource = new ApiDataSource(this.apiService, this.docType, this.pageSize);
    this.apiService.getDocDimensions(this.docType).pipe(take(1))
      .subscribe(data => {
        if (data.length > 0) { this.additianalColumn1 = data[0] }
        if (data.length > 2) { this.additianalColumn2 = data[2] }
      })
  }

  ngAfterViewInit() {
    this.dataSource.dataTable = this.dataTable;
    setTimeout(() => {
      this.dataTable.columns.forEach(c => this.dataTable.filters[c.field] = { matchMode: '=', value: null })
      this.filters.filter(f => f.right).forEach(f => this.dataTable.filters[f.left] = { matchMode: f.center, value: f.right });
      this.dataSource.goto(this.docID);
      this._afterViewInit = true;
    });
  }

  update(col: Column, event) {
    this.dataTable.filters[col.field] = { matchMode: col.filterMatchMode, value: event };
    this.Sort(event);
  }

  Sort = (event) => { if (this._afterViewInit) { this.dataSource.sort() } }
  onSelectHandler = (row) => this.onSelect.emit(row);

}

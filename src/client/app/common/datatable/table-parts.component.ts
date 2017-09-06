import { Component, ViewChild, OnInit, Input, AfterViewInit } from '@angular/core';
import { MdPaginator, MdSort, SelectionModel } from '@angular/material';
import { DataSource } from '@angular/cdk/table';
import { BaseDynamicControl } from '../../common/dynamic-form/dynamic-form-base';
import { MdTableDataSource } from '../../common/datatable/array-data-source';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: string };

@Component({
  selector: 'j-table-part',
  styles: [`.mat-column-select {
    min-width: 32px;
    max-width: 32px;
    margin-left: -20px;
  }
  `],
  templateUrl: './table-parts.component.html',
})
export class TablePartsComponent implements OnInit, AfterViewInit {
  @Input() data: any[] = [];
  @Input() pageSize = 5;
  @Input() view: BaseDynamicControl<any>[];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;

  dataSource: MdTableDataSource<any> | null;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: any[] = [];
  columns: ColDef[] = [];

  ngOnInit() {
    this.columns = this.view.map((el) => {
      const result = { field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, order: el.order, style: null };
      return result;
    });
    this.columns.sort((a, b) => a.order - b.order);
    this.displayedColumns = this.columns.map((c) => c.field);
    this.displayedColumns.unshift('select');
  }

  ngAfterViewInit() {
    Promise.resolve().then(() => this.dataSource = new MdTableDataSource(this.data, this.sort, this.paginator));
  }

  isAllSelected(): boolean {
    if (!this.dataSource) { return false; }
    if (this.selection.isEmpty()) { return false; }
    return this.selection.selected.length >= this.data.length;
  }

  masterToggle() {
    if (!this.dataSource) { return; }
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(data => this.selection.select(data));
    }
  }

}

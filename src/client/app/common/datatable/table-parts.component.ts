import { Component, ViewChild, OnInit, Input, AfterViewInit } from '@angular/core';
import { MdPaginator, MdSort, SelectionModel, MdDialog } from '@angular/material';
import { DataSource } from '@angular/cdk/table';
import { BaseDynamicControl } from '../../common/dynamic-form/dynamic-form-base';
import { MdTableDataSource } from '../../common/datatable/array-data-source';
import { FormArray, FormGroup } from '@angular/forms';
import { TablePartsDialogComponent } from './../../dialog/table-parts.dialog.component';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: {} };
const properties = ['id', 'name', 'progress', 'color'];

@Component({
  selector: 'j-table-part',
  styles: [`
    .mat-column-select {
      min-width: 32px;
      max-width: 32px;
      margin-left: -20px;
    }
    .mat-table {
      max-height: 240px;
      overflow: auto;
    }
    .search-header {
      min-height: 46px;
      margin-top: 10px;
    }`
  ],
  templateUrl: './table-parts.component.html',
})
export class TablePartsComponent implements OnInit, AfterViewInit {
  @Input() pageSize = 5;
  @Input() view: BaseDynamicControl<any>[];
  @Input() formGroup: FormArray;
  @Input() tab: any;

  @ViewChild(MdSort) sort: MdSort;

  dataSource: MdTableDataSource<any> | null;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: any[] = [];
  columns: ColDef[] = [];

  constructor(public dialog: MdDialog) {
  }

  ngOnInit() {
    this.columns = this.view.map((el) => {
      const result = { field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, order: el.order, style: el.style };
      return result;
    });
    this.displayedColumns = this.columns.map((c) => c.field);
    this.displayedColumns.unshift('select');
  }

  ngAfterViewInit() {
    Promise.resolve().then(() => this.dataSource = new MdTableDataSource(this.formGroup.value, this.sort));
  }

  isAllSelected(): boolean {
    if (!this.dataSource) { return false; }
    if (this.selection.isEmpty()) { return false; }
    return this.selection.selected.length >= this.formGroup.value.length;
  }

  masterToggle() {
    if (!this.dataSource) { return; }
    if (this.isAllSelected()) {
      this.selection.clear();
    } else { this.dataSource.data.forEach(data => this.selection.select(data)) }
  }

  openDialog(row) {
    const index = this.formGroup.value.findIndex(el => JSON.stringify(el) === JSON.stringify(row));
    const formGroup = this.formGroup.controls[index];
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: formGroup } })
      .afterClosed()
      .subscribe(data => {
        if (data) { Object.assign(row, data)
        } else { formGroup.patchValue(row) }
      });
  }

  Add() {
    const sampleRow: FormGroup = (this.tab.sampleRow as FormGroup);
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: sampleRow } })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.formGroup.push(sampleRow);
          this.dataSource.data.push(data);
          this.dataSource.data = this.dataSource.data;
        }
      });
  }

  Delete() {
      this.selection.selected.forEach(element => {
          const index = this.formGroup.value.findIndex(el => JSON.stringify(el) === JSON.stringify(element));
          this.formGroup.removeAt(index);
          this.dataSource.data = this.formGroup.value;
        }
      );
      this.selection.clear();
  }

  Copy() {
    const index = this.formGroup.value.findIndex(el => JSON.stringify(el) === JSON.stringify(this.selection.selected[0]));
    const sampleRow: FormGroup = this.formGroup.at(index) as FormGroup;
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: sampleRow } })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.formGroup.push(sampleRow);
          this.dataSource.data.push(data);
          this.dataSource.data = this.dataSource.data;
          this.selection.clear();
        }
      });
  }

  Up() {
  }

  Down() {
  }
}

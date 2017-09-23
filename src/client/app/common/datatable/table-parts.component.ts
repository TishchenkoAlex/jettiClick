import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MdDialog, MdSort } from '@angular/material';

import { BaseJettiFromControl, TableDynamicControl } from '../../common/dynamic-form/dynamic-form-base';
import { DocService } from '../doc.service';
import { DynamicFormService, patchOptionsNoEvents } from '../dynamic-form/dynamic-form.service';
import { TablePartsDialogComponent } from './../../dialog/table-parts.dialog.component';
import { MdTableDataSource } from './md-table-datasource';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: {} };

@Component({
  selector: 'j-table-part',
  styles: [`
    .mat-column-select {
      min-width: 32px;
      max-width: 32px;
    }
    .mat-column-index {
      min-width: 32px;
      max-width: 32px;
      margin-left: -23px;
    }
    .mat-table {
      max-height: 240px;
      overflow: auto;
    }
    .search-header {
      min-height: 46px;
      margin-top: 10px;
    }
    .mat-row:hover {
      background: #f5f5f5;
    }`
  ],
  templateUrl: './table-parts.component.html',
})
export class TablePartsComponent implements OnInit, AfterViewInit {
  @Input() pageSize = 5;
  @Input() view: BaseJettiFromControl<any>[];
  @Input() formGroup: FormArray;
  @Input() tab: any;
  @Input() control: TableDynamicControl;

  @Output() onChange: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild(MdSort) sort: MdSort;

  dataSource: MdTableDataSource<any> | null;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: any[] = [];
  columns: ColDef[] = [];


  constructor(public dialog: MdDialog, private ds: DocService, private fs: DynamicFormService) {
  }

  ngOnInit() {
    this.columns = this.view.map((el) => {
      const result = { field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, order: el.order, style: el.style };
      return result;
    });
    this.displayedColumns = this.columns.map((c) => c.field);
    this.displayedColumns.unshift('index', 'select');
  }

  ngAfterViewInit() {
    Promise.resolve().then(_ => this.dataSource = new MdTableDataSource(this.formGroup.value, this.sort));
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

  private copyFormGroup(formGroup: FormGroup): FormGroup {
    const newFormGroup = this.fs.copyFormGroup(formGroup);
    return newFormGroup;
  }

  EditRow(row) {
    const formGroup = this.formGroup.controls[row.index] as FormGroup;
    this.dialog.open(TablePartsDialogComponent, {data: { view: this.view, formGroup: this.copyFormGroup(formGroup) } })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          formGroup.patchValue(data, {emitEvent: false});
          this.dataSource.data = this.formGroup.value;
          this.onChange.emit(data);
        }
      });
  }

  AddRow() {
    const formGroup = this.copyFormGroup(this.tab.sampleRow);
    formGroup.controls['index'].setValue(this.formGroup.length + 1, patchOptionsNoEvents);
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: formGroup } })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          formGroup.patchValue(data, {emitEvent: false});
          this.formGroup.push(formGroup);
          this.dataSource.data = this.formGroup.value;
          this.onChange.emit(data);
        }
      });
  }

  Delete() {
    this.selection.selected.forEach(element => {
      this.formGroup.removeAt(this.formGroup.controls.findIndex((el: FormGroup) =>
      el.controls['index'].value === element.index));
      this.onChange.emit(this.formGroup.value);
    });
    this.selection.clear();
    for (let i = 0; i < this.formGroup.length; i++) {
      const formGroup = this.formGroup.controls[i] as FormGroup;
      (formGroup.controls['index'] as FormControl).patchValue(i, {emitEvent: false} );
    }
    this.dataSource.data = this.formGroup.value;
  }

  CopyRow() {
    const index = this.selection.selected[0].index;
    const newFormGroup = this.copyFormGroup(this.formGroup.at(index) as FormGroup);
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: newFormGroup } })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          data.index = this.formGroup.length;
          newFormGroup.patchValue(data, patchOptionsNoEvents);
          this.formGroup.push(newFormGroup);
          this.dataSource.data = this.formGroup.value;
          this.onChange.emit(data);
          this.selection.clear();
        }
      });
  }

  Up() {
    const index = this.selection.selected[0].index;
    if (index === 0) { return }
    this.dataSource.data[index].index = index - 1;
    this.dataSource.data[index - 1].index = index;
    this.dataSource.data = this.dataSource.data.sort((a, b) => a.index - b.index);
    this.formGroup.patchValue(this.dataSource.data, patchOptionsNoEvents);
  }

  Down() {
    const index = this.selection.selected[0].index;
    if (index >= this.formGroup.length - 1) { return }
    this.dataSource.data[index].index = index + 1;
    this.dataSource.data[index + 1].index = index;
    this.dataSource.data = this.dataSource.data.sort((a, b) => a.index - b.index);
    this.formGroup.patchValue(this.dataSource.data, patchOptionsNoEvents);
  }
}

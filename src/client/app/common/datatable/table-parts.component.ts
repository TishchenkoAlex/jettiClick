import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatSort, MatTableDataSource } from '@angular/material';

import {
    AutocompleteJettiFormControl,
    BaseJettiFromControl,
    TableDynamicControl,
    ScriptJettiFormControl,
} from '../../common/dynamic-form/dynamic-form-base';
import { DocService } from '../doc.service';
import { patchOptionsNoEvents } from '../dynamic-form/dynamic-form.service';
import { copyFormGroup } from '../utils';
import { TablePartsDialogComponent } from './../../dialog/table-parts.dialog.component';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: {} };

@Component({
  selector: 'j-table-part',
  styles: [`
    .search-header {
      min-height: 46px;
      margin-top: 10px;
    }`
  ],
  templateUrl: './table-parts.component.html',
})
export class TablePartsComponent implements OnInit, AfterViewInit {
  private view: BaseJettiFromControl<any>[];
  @Input() formGroup: FormArray;
  @Input() control: TableDynamicControl;

  @Output() onChange: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<any> | null;
  selection = new SelectionModel<any>(true, []);
  displayedColumns: any[] = [];
  columns: ColDef[] = [];
  sampleRow: FormGroup;

  constructor(public dialog: MatDialog, private ds: DocService) { }

  ngOnInit() {
    this.view = this.control.value as BaseJettiFromControl<any>[];
    this.columns = this.view.filter(c => !(c instanceof ScriptJettiFormControl)).map((el) => {
      const result = { field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, order: el.order, style: el.style };
      return result;
    });
    this.displayedColumns = this.columns.map((c) => c.field);
    this.displayedColumns.unshift('index', 'select');

    this.sampleRow = this.formGroup.controls[this.formGroup.length - 1] as FormGroup;
    setTimeout(_ => this.formGroup.removeAt(this.formGroup.length - 1));

  }

  ngAfterViewInit() {
    setTimeout(_ => {
      this.dataSource = new MatTableDataSource(this.formGroup.value);
      this.dataSource.sort = this.sort;
    });
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
    const newFormGroup = copyFormGroup(formGroup);
    return newFormGroup;
  }

  EditRow(row) {
    const formGroup = this.formGroup.controls[row.index] as FormGroup;
    const newFormGroup = this.copyFormGroup(formGroup);
    this.dialog.open(TablePartsDialogComponent,
      { data: { view: this.view, formGroup: newFormGroup },  panelClass: 'editRowDialog' })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          formGroup.patchValue(data, { emitEvent: false });
          this.dataSource.data = this.formGroup.value;
          this.onChange.emit(data);
        }
      });
  }

  AddRow() {
    const newFormGroup = this.copyFormGroup(this.sampleRow);
    newFormGroup.controls['index'].setValue(this.formGroup.length, patchOptionsNoEvents);
    this.dialog.open(TablePartsDialogComponent,
      { data: { view: this.view, formGroup: newFormGroup },  panelClass: 'editRowDialog' })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          newFormGroup.patchValue(data, { emitEvent: false });
          this.formGroup.push(newFormGroup);
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
      (formGroup.controls['index'] as FormControl).patchValue(i, { emitEvent: false });
    }
    this.dataSource.data = this.formGroup.value;
  }

  CopyRow() {
    const index = this.selection.selected[0].index;
    const newFormGroup = this.copyFormGroup(this.formGroup.at(index) as FormGroup);
    this.dialog.open(TablePartsDialogComponent, 
      { data: { view: this.view, formGroup: newFormGroup },  panelClass: 'editRowDialog' })
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

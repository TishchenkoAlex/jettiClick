import { DynamicFormService, patchOptions } from '../dynamic-form/dynamic-form.service';
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MdDialog, MdSort } from '@angular/material';

import { BaseJettiFromControl } from '../../common/dynamic-form/dynamic-form-base';
import { DocService } from '../doc.service';
import { TablePartsDialogComponent } from './../../dialog/table-parts.dialog.component';
import { MdTableDataSource } from './md-table-datasource';

interface ColDef { field: string; type: string; label: string; hidden: boolean; order: number; style: {} };

@Component({
  selector: 'j-table-part',
  styles: [`
    .mat-column-select {
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
    this.displayedColumns.unshift('select');
  }

  ngAfterViewInit() {
    Promise.resolve().then(() => this.dataSource = new MdTableDataSource(this.formGroup.value, this.sort));
    this.view.filter(v => v.change).forEach(v => {
      this.formGroup.controls.forEach(f => {
        const control = (f as FormGroup).controls[v.key];
        control.valueChanges.subscribe(data => this.ds.OnClientScript(control as FormGroup, data, v.change));
      });
    });


    this.formGroup.valueChanges.subscribe(data => {
        console.log('ROW CHANGE DATA = ', data, 'ROW CHANGE FROMGROUP = ', this.formGroup.value);
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
    const newFormGroup = this.fs.copyFormGroup(formGroup);
    this.view.filter(v => v.change).forEach(v => {
      const control = newFormGroup.controls[v.key];
      control.valueChanges.subscribe(data => this.ds.OnClientScript(control as FormGroup, data, v.change));
    });
    return newFormGroup;
  }

  EditRow(row, index) {
    const formGroup = this.formGroup.controls[index] as FormGroup;
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: this.copyFormGroup(formGroup) } })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          formGroup.patchValue(data, patchOptions);
          this.dataSource.data = this.formGroup.value;
        }
      });
  }

  AddRow() {
    const formGroup = this.copyFormGroup(this.tab.sampleRow);
    formGroup.controls['index'].setValue(this.formGroup.length + 1, patchOptions);
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: formGroup } })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          formGroup.patchValue(data, patchOptions);
          this.formGroup.push(formGroup);
          this.dataSource.data = this.formGroup.value;
        }
      });
  }

  Delete() {
    this.selection.selected.forEach(element => this.formGroup.removeAt(element.index));
    this.selection.clear();
    for (let i = 0; i < this.formGroup.length; i++) {
      const formGroup = this.formGroup.controls[i] as FormGroup;
      formGroup.controls['index'].setValue(i, patchOptions);
    }
    this.dataSource.data = this.formGroup.value;
  }

  CopyRow() {
    const index = this.selection.selected[0].index;
    const newFormGroup = this.copyFormGroup(this.formGroup.at(index) as FormGroup);
    newFormGroup.controls['index'].setValue(this.formGroup.length + 1, patchOptions);
    this.dialog.open(TablePartsDialogComponent, { data: { view: this.view, formGroup: newFormGroup } })
      .afterClosed()
      .take(1)
      .subscribe(data => {
        if (data) {
          this.formGroup.push(newFormGroup);
          this.dataSource.data = this.formGroup.value;
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
    this.formGroup.patchValue(this.dataSource.data, patchOptions);
  }

  Down() {
    const index = this.selection.selected[0].index;
    if (index >= this.formGroup.length - 1) { return }
    this.dataSource.data[index].index = index + 1;
    this.dataSource.data[index + 1].index = index;
    this.dataSource.data = this.dataSource.data.sort((a, b) => a.index - b.index);
    this.formGroup.patchValue(this.dataSource.data, patchOptions);
  }
}

// tslint:disable:no-output-on-prefix
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { merge } from 'rxjs/observable/merge';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { TableDynamicControl } from '../../common/dynamic-form/dynamic-form-base';
import { cloneFormGroup, patchOptionsNoEvents } from '../../common/dynamic-form/dynamic-form.service';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { EditableColumn, Table } from './table';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-table-part-png',
  templateUrl: './table-parts.png.component.html',
})
export class TablePartsComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormArray;
  @Input() control: TableDynamicControl;
  @ViewChild(Table) dataTable: Table;
  @ViewChildren(EditableColumn) editableColumns: QueryList<EditableColumn>;

  dataSource: any[];
  columns: ColumnDef[] = [];
  selection = [];
  showTotals = false;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _valueChanges$: Subscription = Subscription.EMPTY;

  constructor(private api: ApiService, private ds: DocService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.columns = this.control.controls.map((el) => <ColumnDef>{
      field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, onChange: el.onChange, onChangeServer: el.onChangeServer,
      order: el.order, style: el.style, required: el.required, readOnly: el.readOnly, totals: el.totals, data: el
    });
    this.control.controls.forEach(v => v.showLabel = false);
    this.showTotals = this.control.controls.findIndex(v => v.totals > 0) !== -1;
    this.dataSource = this.formGroup.getRawValue();

    this._subscription$ = merge(...[this.ds.save$, this.ds.delete$]).subscribe(data => {
      this.dataSource = data[this.control.key];
      this.cd.detectChanges();
    });
  }

  getControl(i: number) {
    return this.formGroup.at(i) as FormGroup;
  }

  getControlValue(index: number, field: string) {
    const value = this.getControl(index).get(field).value;
    const result = value && (value.value || typeof value === 'object' ? value.value || '' : value || '');
    return result;
  }

  private addCopy(newFormGroup: FormGroup) {
    newFormGroup.controls['index'].setValue(this.formGroup.length, patchOptionsNoEvents);
    this.formGroup.push(newFormGroup);
    this.dataSource.push(newFormGroup.getRawValue());
    this.selection = [newFormGroup.getRawValue()];
  }

  add() {
    const newFormGroup = cloneFormGroup(this.formGroup['sample']);
    Object.values(newFormGroup.controls).forEach(c => { if (c.validator) { c.setErrors({ 'required': true }, { emitEvent: false }); } });
    this.addCopy(newFormGroup);
    setTimeout(() => {
      const rows = this.editableColumns.toArray();
      const firsFiled = rows[0].field;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].field === firsFiled) return rows[i].openCell();
      }
    });
    // (this.dataTable).first = Math.max(this.dataSource.length - 9, 0);
  }

  copy() {
    const newFormGroup = cloneFormGroup(this.formGroup.at(this.selection[0].index) as FormGroup);
    this.addCopy(newFormGroup);
    // (this.dataTable).first = Math.max(this.dataSource.length - 9, 0);
  }

  delete() {
    for (const element of this.selection) {
      const rowIndex = this.formGroup.controls.findIndex((el: FormGroup) => el.controls['index'].value === element.index);
      this.formGroup.removeAt(rowIndex);
    }
    this.renum();
    this.dataSource = this.formGroup.getRawValue();
    const index = this.selection[0].index;
    const selectRow = this.dataSource[index] || this.dataSource[index - 1];
    this.selection = selectRow ? [selectRow] : [];
  }

  private renum() {
    for (let i = 0; i < this.formGroup.length; i++) {
      this.formGroup.at(i).get('index').patchValue(i, { emitEvent: false });
    }
  }

  onEditComplete(event) { }
  onEditInit(event) { }
  onEditCancel(event) { }

  calcTotals(field: string): number {
    return (this.formGroup.value as any[]).map(v => v[field]).reduce((a, b) => a + b, 0);
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._valueChanges$.unsubscribe();
  }

}

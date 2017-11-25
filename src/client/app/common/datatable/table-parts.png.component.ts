import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { FormArray, FormGroup } from '@angular/forms';
import { DataTable } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { catchError, debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import {
    BaseJettiFromControl,
    ScriptJettiFormControl,
    TableDynamicControl,
} from '../../common/dynamic-form/dynamic-form-base';
import { patchOptionsNoEvents } from '../../common/dynamic-form/dynamic-form.service';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { cloneFormGroup } from '../utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-table-part-png',
  templateUrl: './table-parts.png.component.html',
})
export class TablePartsPNGComponent implements OnInit, OnDestroy, AfterViewInit {
  private view: BaseJettiFromControl<any>[];
  @Input() formGroup: FormArray;
  @Input() control: TableDynamicControl;

  @Output() onChange: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(DataTable) dataTable: DataTable;
  dataSource: any[];
  columns: ColumnDef[] = [];
  sampleRow: FormGroup;
  selection = [];
  suggests = [];

  private _subscription$: Subscription = Subscription.EMPTY;

  constructor(private api: ApiService, private ds: DocService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.view = this.control.value as BaseJettiFromControl<any>[];
    this.columns = this.view.filter(c => !(c instanceof ScriptJettiFormControl)).map((el) => {
      const result: ColumnDef = {
        field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, change: el.change,
        order: el.order, style: el.style, required: el.required, readOnly: el.readOnly
      };
      return result;
    });

    this.sampleRow = this.formGroup.controls[this.formGroup.length - 1] as FormGroup;
    this.formGroup.removeAt(this.formGroup.length - 1);
    this.dataSource = this.formGroup.getRawValue();
    this._subscription$ = this.ds.save$.subscribe(data => this.dataSource = this.formGroup.getRawValue());
  }

  ngAfterViewInit() {
    setTimeout(() => this.cd.markForCheck());
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
  }

  private copyFormGroup(formGroup: FormGroup): FormGroup {
    const newFormGroup = cloneFormGroup(formGroup);
    return newFormGroup;
  }

  add() {
    const newFormGroup = this.copyFormGroup(this.sampleRow);
    newFormGroup.controls['index'].setValue(this.formGroup.length, patchOptionsNoEvents);
    this.formGroup.push(newFormGroup);
    this.dataSource = this.formGroup.getRawValue();
    this.onChange.emit(this.dataSource);
    this.selection = [newFormGroup.getRawValue()];
  }

  delete() {
    const index = this.selection[0].index;
    for (const element of this.dataTable.selection) {
      this.formGroup.removeAt(this.formGroup.controls.findIndex((el: FormGroup) => el.controls['index'].value === element.index));
    }
    for (let i = 0; i < this.formGroup.length; i++) {
      this.formGroup.get([i]).get('index').patchValue(i, { emitEvent: false });
    }
    this.dataSource = this.formGroup.getRawValue();
    const selectRow = this.dataSource[index] || this.dataSource[index - 1];
    this.selection = selectRow ? [selectRow] : [];
    this.onChange.emit(this.dataSource);
  }

  copy() {
    const index = this.dataTable.selection[0].index;
    const newFormGroup = this.copyFormGroup(this.formGroup.at(index) as FormGroup);
    newFormGroup.controls['index'].setValue(this.formGroup.length, patchOptionsNoEvents);
    this.formGroup.push(newFormGroup);
    this.dataSource = this.formGroup.getRawValue();
    this.selection = [newFormGroup.getRawValue()];
    this.onChange.emit(this.dataSource);
  }

  suggestChange() {
    this.cd.markForCheck();
  }

  Selection() {
    this.selection = [];
  }

}

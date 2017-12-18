import {
    AfterViewInit,
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
import { FormArray, FormGroup } from '@angular/forms';
import { DataTable } from 'primeng/primeng';
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
export class TablePartsPNGComponent implements OnInit, AfterViewInit, OnDestroy {
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
  totalsCount = 0;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _valueChanges$: Subscription = Subscription.EMPTY;

  constructor(private api: ApiService, private ds: DocService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.view = this.control.value as BaseJettiFromControl<any>[];
    this.columns = this.view.filter(c => !(c instanceof ScriptJettiFormControl)).map((el) => {
      const result: ColumnDef = {
        field: el.key, type: el.controlType, label: el.label, hidden: el.hidden, onChange: el.onChange, onChangeServer: el.onChangeServer,
        order: el.order, style: el.style, required: el.required, readOnly: el.readOnly, totals: el.totals, data: el
      };
      return result;
    });
    this.view.forEach(v => v.showLabel = false);
    this.totalsCount = this.view.filter(v => v.totals > 0).length;
    this.sampleRow = this.formGroup.controls[this.formGroup.length - 1] as FormGroup;
    this.formGroup.removeAt(this.formGroup.length - 1);
    this.dataSource = this.formGroup.getRawValue();
    this._subscription$ = this.ds.save$.subscribe(data => this.dataSource = this.formGroup.getRawValue());
    this._valueChanges$ = this.formGroup.valueChanges.subscribe(data => this.onChange.emit(data));
  }

  ngAfterViewInit() {
    setTimeout(() => this.cd.markForCheck());
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._valueChanges$.unsubscribe();
  }

  private copyFormGroup(formGroup: FormGroup): FormGroup {
    return cloneFormGroup(formGroup);
  }

  private addCopy(newFormGroup) {
    newFormGroup.controls['index'].setValue(this.formGroup.length, patchOptionsNoEvents);
    this.formGroup.push(newFormGroup);
    this.dataSource = this.formGroup.getRawValue();
    this.selection = [newFormGroup.getRawValue()];
    this.onChange.emit(this.selection[0]);
  }

  add() {
    this.addCopy(this.copyFormGroup(this.sampleRow));
    (this.dataTable).first = Math.max(this.dataSource.length - 9, 0);
  }

  copy() {
    const newFormGroup = this.copyFormGroup(this.formGroup.at(this.selection[0].index) as FormGroup);
    this.addCopy(newFormGroup);
    (this.dataTable).first = Math.max(this.dataSource.length - 9, 0);
  }

  delete() {
    const index = this.selection[0].index;
    for (const element of this.selection) {
      const rowIndex = this.formGroup.controls.findIndex((el: FormGroup) => el.controls['index'].value === element.index);
      this.onChange.emit((this.formGroup.at(rowIndex) as FormGroup).getRawValue());
      this.formGroup.removeAt(rowIndex);
    }
    for (let i = 0; i < this.formGroup.length; i++) { this.formGroup.get([i]).get('index').patchValue(i, { emitEvent: false })}
    this.dataSource = this.formGroup.getRawValue();
    const selectRow = this.dataSource[index] || this.dataSource[index - 1];
    this.selection = selectRow ? [selectRow] : [];
  }

  onEditComplete(event) {
    console.log('onEditComplete', event)
  }

  onEdit(event) {
    console.log('onEdit', event)
  }

  onEditCancel(event) {
    console.log('onEditCancel', event);
  }

  calcTotals(field: string): number {
    let result = 0;
    for (const c of <FormGroup[]>this.formGroup.controls) { result += c.controls[field].value }
    return result;
  }

}

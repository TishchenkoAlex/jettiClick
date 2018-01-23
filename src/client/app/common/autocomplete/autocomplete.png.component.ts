import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete } from 'primeng/primeng';
import { take } from 'rxjs/operators';

import { ISuggest } from '../../../../server/models/api';
import { JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { ApiService } from '../../services/api.service';
import { calendarLocale, dateFormat } from './../../primeNG.module';

// tslint:disable:no-non-null-assertion
export function AutocompleteValidator(component: AutocompleteComponent): ValidatorFn {
  return (c: AbstractControl): { [key: string]: any } => {
    if (!component.required || c.value!.value) { return null; }
    return { 'required': true };
  };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-autocomplete-png',
  templateUrl: './autocomplete.png.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutocompleteComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => AutocompleteComponent), multi: true, },
  ]
})
export class AutocompleteComponent implements ControlValueAccessor, Validator {
  locale = calendarLocale;
  dateFormat = dateFormat;

  @Input() readOnly = false;
  @Input() owner;
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hidden = false;
  @Input() tabIndex = -1;
  @Input() showOpen = true;
  @Input() showFind = true;
  @Input() showClear = true;
  @Input() showLabel = true;
  @Input() type = '';
  @Input() inputStyle;
  @Input() checkValue = true;
  @Input() openButton = true;
  @Output() change = new EventEmitter();
  @Output() focus = new EventEmitter();
  @ViewChild('ac') input: AutoComplete;
  @Input() id: string;

  form: FormGroup = new FormGroup({
    suggest: new FormControl({ value: this.value, disabled: this.disabled }, AutocompleteValidator(this))
  });
  suggest = this.form.controls['suggest'] as FormControl;

  private NO_EVENT = false;

  showDialog = false;

  get isComplexValue() { return this.value!.type!.includes('.'); }
  get isTypeControl() { return this.type!.startsWith('Types.'); }
  get isComplexControl() { return this.type!.includes('.'); }
  get isTypeValue() { return this.value!.type!.startsWith('Types.'); }
  get EMPTY() { return { id: null, code: null, type: this.type, value: null }; }
  get isEMPTY() { return this.isComplexControl && !this.value!.value; }
  get isCatalogParent() { return this.type.startsWith('Catalog.') && this.id === 'parent'; }

  private _value: JettiComplexObject;
  @Input() set value(obj) {
    if (this.isTypeControl && this.placeholder) {
      this.placeholder = this.placeholder.split('[')[0] + '[' + (obj && obj.type ? obj.type : '') + ']';
    }
    this._value = obj;
    this.suggest.patchValue(this._value);
    if (!this.NO_EVENT) { this.onChange(this._value); this.change.emit(this._value); }
    this.NO_EVENT = false;
    this.cd.detectChanges();
  }
  get value() { return this._value; }

  suggests$: ISuggest[] = [];

  // implement ControlValueAccessor interface
  onChange = (value: any) => { };
  private onTouched = () => { };

  writeValue(obj: any): void {
    this.NO_EVENT = true;
    if (!obj) { obj = this.EMPTY; }
    if (!this.type) { this.type = obj.type; }
    if (this.isComplexControl && (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') ||
      (obj && obj.type && obj.type !== this.type && !this.isTypeControl)) {
      this.value = this.EMPTY;
      return;
    }
    this.value = obj;
    this.suggest.markAsDirty();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  // end of implementation ControlValueAccessor interface

  // implement Validator interface
  validate(c: AbstractControl): ValidationErrors | null {
    if (!this.required || c.value!.value) { return null; }
    return { 'required': true };
  }
  // end of implementation Validator interface

  constructor(private api: ApiService, private router: Router, private cd: ChangeDetectorRef) {}

  getSuggests(text) {
    this.api.getSuggests(this.value.type || this.type, text || '', this.isCatalogParent).pipe(take(1)).subscribe(data => {
      this.suggests$ = data;
      this.cd.detectChanges();
    });
  }

  onSelect = (event) => this.value = this.suggest.value;
  handleReset = (event: Event) => this.value = this.EMPTY;
  handleOpen = (event: Event) => this.router.navigate([this.value.type || this.type, this.value.id]);
  handleSearch = (event: Event) => this.showDialog = true;
  select = () => this.input.inputEL.nativeElement.select();
  onBlur() { if (this.value && this.suggest.value && (this.value.id !== this.suggest.value.id)) { this.value = this.value; } }

  searchComplete(row: ISuggest) {
    this.showDialog = false;
    if (!row) { return; }
    this.value = { id: row.id, code: row.code, type: row.type, value: this.isTypeValue ? null : row.description };
  }

  calcFilters() {
    const result = [];
    if (this.owner!.value && this.owner!.value.value) { result.push({ left: this.owner.owner, center: '=', right: this.owner.value }); }
    if (this.isCatalogParent) { result.push({ left: 'isfolder', center: '=', right: true }); }
    return result;
  }
}

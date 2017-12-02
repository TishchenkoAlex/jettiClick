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
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete } from 'primeng/primeng';
import { take } from 'rxjs/operators';

import { JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { ApiService } from '../../services/api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-autocomplete-png',
  templateUrl: './autocomplete.png.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutocompletePNGComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => AutocompletePNGComponent), multi: true, },
  ]
})
export class AutocompletePNGComponent implements ControlValueAccessor, Validator {

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
  @ViewChild('ac') input: AutoComplete;

  form: FormGroup = new FormGroup({
    suggest: this.required ? new FormControl(this.value, Validators.required) : new FormControl(this.value)
  });

  private NO_EVENT = false;
  showDialog = false;

  get suggest() { return this.form.controls['suggest']; }
  get isComplexValue() { return this.value && this.value.type && this.value.type.includes('.') }
  get isTypeControl() { return this.type && this.type.startsWith('Types.') }
  get isTypeValue() { return this.value && this.value.type && this.value.type.startsWith('Types.') }
  get EMPTY() { return { id: '', code: '', type: this.type, value: null } }

  private _value: JettiComplexObject;
  @Input() set value(obj) {
    if (obj) { delete obj.data }
    if (this.isTypeControl && this.placeholder) { this.placeholder = this.placeholder.split('[')[0] + '[' + (obj.type || '') + ']' }
    this._value = obj;
    this.suggest.patchValue(obj);
    if (!this.NO_EVENT) { this.onChange(this._value); this.change.emit(this._value) }
    this.NO_EVENT = false;
  }
  get value() { return this._value; }

  suggests$: any[];

  // implement ControlValueAccessor interface
  private onChange = (value: any) => { }
  private onTouched = () => { };

  writeValue(obj: any): void {
    this.NO_EVENT = true;
    if (!obj) { obj = this.EMPTY }
    if (!this.type) { this.type = obj.type }
    if ((this.type && this.type.includes('.')) && (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') ||
      (obj && obj.type && obj.type !== this.type && !this.isTypeControl)) {
      this.value = this.EMPTY;
      return;
    }
    this.value = obj;
    if (this.type && this.type.includes('.') && (this.value && !this.value.value)) { this.handleReset(null) }
    this.cd.markForCheck();
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
    if (!this.required) { return null }
    if (c.value.value) { return null }
    return { 'required': true }
  };
  // end of implementation Validator interface

  constructor(private api: ApiService, private router: Router, private cd: ChangeDetectorRef) { }

  getSuggests(text) {
    this.api.getSuggests(this.value.type || this.type, text || '').pipe(take(1)).subscribe(data => {
      this.suggests$ = data;
      this.cd.markForCheck();
    });
  }

  onBlur() {
    if (this.value && this.suggest.value && (this.value.id !== this.suggest.value.id)) {
      this.value = this.value;
    }
  }

  onSelect(event) {
    this.value = this.suggest.value;
  }

  handleReset(event: Event) {
    this.value = '' as any;
    this.suggest.markAsDirty();
    this._value = this.EMPTY;
  }

  handleOpen(event: Event) {
    event.stopPropagation();
    this.router.navigate([this.value.type || this.type, this.value.id]);
  }

  handleSearch(event: Event) {
    this.showDialog = true;
  }

  searchComplete(row) {
    this.showDialog = false;
    if (!row) { return };
    this.value = {
      id: row.id, code: row.code, type: row.type,
      value: this.isTypeValue ? null : row.description,
      data: 'NO_SUGGEST'
    };
  }

  focus() {
    if (this.input instanceof AutoComplete) {
      this.input.inputEL.nativeElement.focus();
    }
  }
}

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
import { AutoComplete } from 'primeng/components/autocomplete/autocomplete';
import { take } from 'rxjs/operators';

import { ISuggest } from '../../../../server/models/api';
import { FormListSettings } from '../../../../server/models/user.settings';
import { JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { ApiService } from '../../services/api.service';
import { calendarLocale, dateFormat } from './../../primeNG.module';

function AutocompleteValidator(component: AutocompleteComponent): ValidatorFn {
  return (c: AbstractControl): { [key: string]: any } => {
    if (!component.required || (c.value && c.value.value)) { return null; }
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
  locale = calendarLocale; dateFormat = dateFormat;

  @Input() readOnly = false;
  @Input() owner: { owner: { dependsOn: string, filterBy: string }, value: any };
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
  @Input() formControl: FormControl;

  form: FormGroup = new FormGroup({
    suggest: new FormControl({ value: this.value, disabled: this.disabled }, AutocompleteValidator(this))
  });
  suggest = this.form.controls['suggest'] as FormControl;
  suggests$: ISuggest[] = [];

  private NO_EVENT = false;
  showDialog = false;

  get isComplexValue() { return this.value &&  this.value.type && this.value.type.includes('.'); }
  get isTypeControl() { return this.type && this.type.startsWith('Types.'); }
  get isComplexControl() { return this.type && this.type.includes('.'); }
  get isTypeValue() { return this.value &&  this.value.type && this.value.type.startsWith('Types.'); }
  get EMPTY() { return { id: null, code: null, type: this.type, value: null }; }
  get isEMPTY() { return this.isComplexControl && !(this.value && this.value.value); }
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
  }
  get value() { return this._value; }

  // implement ControlValueAccessor interface
  onChange = (value: any) => { };
  registerOnChange(fn: any): void { this.onChange = fn; }
  onTouched = () => { };
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled; }

  writeValue(obj: any): void {
    this.NO_EVENT = true;
    if (!obj) { obj = this.EMPTY; }
    if (!this.type) { this.type = obj.type; }
    if (this.isComplexControl && (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') ||
      (obj && obj.type && obj.type !== this.type && !this.isTypeControl)) {
      obj = this.EMPTY;
    }
    this.value = obj;
    this.suggest.markAsDirty({onlySelf: true});
    this.cd.markForCheck();
  }
  // end of implementation ControlValueAccessor interface

  // implement Validator interface
  validate(c: AbstractControl): ValidationErrors | null {
    if (!this.required || (c.value && c.value.value)) { return null; }
    return { 'required': true };
  }
  // end of implementation Validator interface

  constructor(private api: ApiService, private router: Router, private cd: ChangeDetectorRef) { }

  getSuggests(text) {
    this.api.getSuggests(this.value.type || this.type, text, this.isCatalogParent).pipe(take(1)).subscribe(data => {
      this.suggests$ = data;
      this.cd.detectChanges();
    });
  }

  handleReset = (event: Event) => this.value = this.EMPTY;
  handleOpen = (event: Event) => this.router.navigate([this.value.type || this.type, this.value.id]);
  handleSearch = (event: Event) => this.showDialog = true;
  select = () => this.input.inputEL.nativeElement.select();
  onBlur = (event: Event) => {
    if (this.value && this.suggest.value && (this.value.id !== this.suggest.value.id)) { this.value = this.value; }
  }

  searchComplete(row: ISuggest) {
    this.showDialog = false;
    if (!row) { return; }
    this.value = { id: this.isTypeValue ? null : row.id, code: row.code, type: row.type, value: this.isTypeValue ? null : row.description };
  }

  calcFilters() {
    const result = new FormListSettings();
    if (this.owner && this.owner.owner && this.owner.owner.filterBy) {
      if ((typeof this.owner.value === 'object' && this.owner.value.id)) {
        result.filter.push({ left: this.owner.owner.filterBy, center: '=', right: this.owner.value });
      }
    }
    // if (this.isCatalogParent) { result.push({ left: 'isfolder', center: '=', right: true }); }
    const doc = this.formControl && this.formControl.root.value;
    if (doc && doc.type && doc.type.startsWith('Document.') && doc.company.id) {
      result.filter.push({ left: 'company', center: '=', right: doc.company });
    }
    return result;
  }

  calcDialogWidth() {
    return Math.max(Math.floor(window.innerWidth / 2.5), 400);
  }
}

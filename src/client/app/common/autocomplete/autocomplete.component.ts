import { DocModel } from '../../../../server/modules/doc.base';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    forwardRef,
    Input,
    OnDestroy,
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
} from '@angular/forms';
import { MatAutocomplete, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { ApiService } from '../../services/api.service';
import { SuggestDialogComponent } from './../../dialog/suggest.dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-autocomplete',
  templateUrl: './autocomplete.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutocompleteComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => AutocompleteComponent), multi: true, },
  ]
})
export class AutocompleteComponent implements OnDestroy, AfterViewInit, ControlValueAccessor, Validator {

  @Input() readOnly = false;
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hidden = false;
  @Input() tabIndex = -1;
  @Input() type = '';
  @Input() checkValue = true;
  @Output() change = new EventEmitter();

  form: FormGroup = new FormGroup({
    suggest: new FormControl(this.value)
  });

  private _subscription$: Subscription = Subscription.EMPTY;
  private NO_EVENT = false;

  get suggest() { return this.form.controls['suggest']; }
  get isComplexValue() { return this.value && this.value.type && this.value.type.includes('.') }
  get isTypeControl() { return this.type.startsWith('Types.') }
  get isTypeValue() { return this.value && this.value.type && this.value.type.startsWith('Types.') }

  private _value: JettiComplexObject;
  @Input() set value(obj) {
    delete obj.data;
    // if (JSON.stringify(obj) === JSON.stringify(this._value)) { return }
    if (this.isTypeControl) { this.placeholder = this.placeholder.split('[')[0] + '[' + (obj.type || '') + ']' }
    this._value = obj;
    this.suggest.patchValue(obj.value ? obj.value : obj);
    if (!this.NO_EVENT) { this.onChange(this._value); this.change.emit(this._value) }
    this.NO_EVENT = false;
  }
  get value() { return this._value; }

  @ViewChild('auto') auto: MatAutocomplete;

  suggests$: Observable<any[]>;

  // implement ControlValueAccessor interface
  private onChange = (value: any) => { }
  private onTouched = () => { };

  writeValue(obj: any): void {
    this.NO_EVENT = true;
    if ((this.type.includes('.')) && (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string')) {
      this.value = { id: '', code: '', type: this.type, value: null };
      return;
    }
    if (obj.type && obj.type !== this.type && !this.isTypeControl) {
      this.value = { id: '', code: '', type: this.type, value: null }
      return;
    }
    this.value = obj;
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

  constructor(private api: ApiService, private router: Router, public dialog: MatDialog) { }

  ngAfterViewInit() {
    this.suggests$ = this.suggest.valueChanges
      .distinctUntilChanged()
      .filter(data => {
        return this.isComplexValue && (typeof data === 'string') && (data !== this.value.value)
          && (this.value.data !== 'NO_SUGGEST');
      })
      .debounceTime(300)
      .switchMap(text => this.getSuggests(this.value.type || this.type, text))
      .catch(err => Observable.of([]));

    this._subscription$ = this.auto.optionSelected.subscribe(data => {
      data.value = 'NO_SUGGEST';
      this.value = data.option.value;
      this.auto.options.reset([]);
    });
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
  }

  onBlur() {
    this.auto.options.reset([]);
    if (this.value.value === this.suggest.value) { return }
    if (!this.isComplexValue || !this.checkValue) { this.value.value = this.suggest.value }
    this.value = this.value;
  }

  displayFn(value: any): string {
    return value && typeof value === 'object' ? value.value : value;
  }

  getSuggests(type, text): Observable<any[]> {
    return this.api.getSuggests(type, text || '');
  }

  handleReset(event) {
    event.stopPropagation();
    this.auto.options.reset([]);
    this.value = { id: '', code: '', type: this.type, value: null };
  }

  handleOpen(event: Event) {
    event.stopPropagation();
    this.auto.options.reset([]);
    this.router.navigate([this.value.type, this.value.id]);
  }

  handleSearch(event: Event) {
    event.stopPropagation();
    this.auto.options.reset([]);
    this.dialog.open(SuggestDialogComponent,
      { data: { docType: this.value.type, docID: this.value.id }, panelClass: 'suggestDialog' })
      .afterClosed()
      .filter(result => !!result)
      .take(1)
      .subscribe((data: DocModel) => {
        this.value = {
          id: data.id, code: data.code, type: data.type,
          value: this.isTypeValue ? null : data.description,
          data: 'NO_SUGGEST'
        };
      });
  }

}


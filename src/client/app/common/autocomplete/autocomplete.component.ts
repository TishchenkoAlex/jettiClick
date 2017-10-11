import { AfterViewInit, Component, forwardRef, Input, OnDestroy, ViewChild } from '@angular/core';
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
import { DocModel } from '../doc.model';
import { SuggestDialogComponent } from './../../dialog/suggest.dialog.component';

@Component({
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
  @Input() tabIndex = false;
  @Input() type = '';

  form: FormGroup = new FormGroup({
    suggest: new FormControl('')
  });

  private _subscription$: Subscription = Subscription.EMPTY;

  private _value: JettiComplexObject;
  @Input() set value(obj) {
    if (this.type.startsWith('Types.')) {
      this.placeholder = this.placeholder.split('[')[0] + '[' + (obj.type || '') + ']';
    }
    this.form.controls['suggest'].setValue(obj.value);
    this._value = obj;
    this.onChange(this._value);
  }
  get value() { return this._value; }
  get suggest() { return this.form.controls['suggest']; }
  get isComplexValue() { return this.value.type.includes('.') }

  @ViewChild('auto') auto: MatAutocomplete;

  suggests$: Observable<any[]>;

  // implement ControlValueAccessor interface
  private onChange = (value: any) => { }
  private onTouched = () => { };

  writeValue(obj: any): void {
    if (obj === this._value) { return }
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
    return this.suggest.errors;
  };
  // end of implementation Validator interface

  constructor(private api: ApiService, private router: Router, public dialog: MatDialog) { }

  ngAfterViewInit() {
    this.suggests$ = this.suggest.valueChanges
      .distinctUntilChanged()
      .filter(data => this.isComplexValue && typeof data === 'string' && this.value.value !== this.suggest.value)
      .debounceTime(300)
      .switchMap(text => this.getSuggests(this.value.type || this.type, text))
      .catch(err => Observable.of([]));

    this._subscription$ = this.auto.optionSelected.subscribe(data => {
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
    if (!this.isComplexValue) { this.value.value = this.suggest.value }
    this.value = this.value;
  }

  displayFn(value: any): string {
    return value && typeof value === 'object' ? value.value : value;
  }

  getSuggests(type, text): Observable<any[]> {
    return this.api.getSuggests(type, text || '');
  }

  handleReset(event) {
    this.value = { id: '', code: '', type: this.type, value: null };
  }

  handleOpen(event) {
    event.stopPropagation();
    this.router.navigate([this.value.type, this.value.id]);
  }

  handleSearch(event: Event) {
    event.stopPropagation();
    this.dialog.open(SuggestDialogComponent,
      { data: { docType: this.value.type, docID: this.value.id }, panelClass: 'suggestDialog' })
      .afterClosed()
      .filter(result => !!result)
      .take(1)
      .subscribe((data: DocModel) => {
        this.value = {
          id: data.id, code: data.code, type: data.type,
          value: this.value.type.startsWith('Types.') ? null : data.description
        };
      });
  }

}


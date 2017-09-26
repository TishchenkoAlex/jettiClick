import { Component, ElementRef, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { MdAutocomplete, MdDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AutocompleteJettiFormControl, JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { ApiService } from '../../services/api.service';
import { DocModel } from '../doc.model';
import { SuggestDialogComponent } from './../../dialog/suggest.dialog.component';

@Component({
  selector: 'j-autocomplete',
  template: `
    <md-form-field fxFlex>
      <input #control mdInput [(ngModel)]="value" [required]="required"
        [placeholder]="placeholder" [mdAutocomplete]="auto" [readOnly]="readOnly"
        ([disabled])="disabled" (blur)="onBlur()" [tabIndex]="tabIndex">
      <button *ngIf="showSearchSpinner" md-icon-button mdSuffix><md-spinner></md-spinner></button>
      <button md-icon-button mdSuffix type="button" style="cursor: pointer"
        (click)="handleSearch($event)" [tabIndex]=-1 autocomplete="off"><md-icon>search</md-icon></button>
      <button md-icon-button mdSuffix type="button" style="cursor: pointer"
        (click)="handleOpen($event)" [tabIndex]=-1 autocomplete="off"><md-icon>visibility</md-icon></button>
      <button md-icon-button mdSuffix type="button" style="cursor: pointer"
        (click)="handleReset($event)" [tabIndex]=-1><md-icon>clear</md-icon></button>
    </md-form-field>

    <md-autocomplete #auto="mdAutocomplete" [displayWith]="displayFn">
     <md-option *ngFor="let value of suggests$ | async" [value]="value">
      <span>{{ value.value }}</span>
      <span> ({{value.code}}) </span>
    </md-option>
  </md-autocomplete>`,
  styles: [
    `md-spinner {width: 13px; height: 13px; position: relative; top: 2px; left: 0px; opacity: 1.0;}`,
    `.suggestDialog .mat-dialog-container {
      padding-bottom: 0px;
    }`
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutocompleteComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => AutocompleteComponent), multi: true, },
  ]
})
export class AutocompleteComponent implements OnInit, ControlValueAccessor, Validator {

  @Input() readOnly = false;
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hidden = false;
  @Input() tabIndex = false;
  @Input() type = '';

  private _value: JettiComplexObject;
  @Input() set value(obj) {
    if (typeof obj !== 'string') {
      if (((obj.id === null) || (obj.id === '')) && this.type.startsWith('Types.')) {
        this.placeholder = this.placeholder.split('[')[0] + '[' + (obj.value || '') + ']';
        Promise.resolve().then(() => { obj.value = '' });
      };
      this._value = obj;
      this.onChange(this._value);
    }
    this._value = obj;
  }
  get value() { return this._value; }

  @ViewChild('control') control: ElementRef;
  @ViewChild('auto') auto: MdAutocomplete;

  suggests$: Observable<any[]>;
  showSearchSpinner = false;

  // implement ControlValueAccessor interface
  private onChange = (value: any) => { };
  private onTouched = () => { };

  writeValue(obj: any): void {
    if (obj !== this._value) {
      this._value = obj;
    }
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

  validate(c: AbstractControl): ValidationErrors | null {
    if (this.required === true) {
      const result = !(c.value && c.value.value);
      if (result) {
         return { 'required': result };
      };
    }
    return null;
  };

  constructor(private api: ApiService, private router: Router, public dialog: MdDialog) { }

  ngOnInit() {
    this.suggests$ = Observable.fromEvent(this.control.nativeElement, 'keyup')
      .debounceTime(400)
      .map((event) => this.control.nativeElement.value)
      .distinctUntilChanged()
      .filter(text => text !== this.value.value)
      .do(() => { this.showSearchSpinner = true; })
      .switchMap(text => {
        return this.getSuggests(this.value.type, text)
      })
      .catch(err => { this.showSearchSpinner = false; return Observable.of<any[]>([]) })
      .do(() => { this.showSearchSpinner = false; });
  }

  onBlur() {
    if (this.control.nativeElement.value !== this.value.value) {
      this.value = Object.assign({}, this._value);
    }
    this.auto.options.reset([]);
  }

  displayFn(value: any): string {
    return value && typeof value === 'object' ? value.value : value;
  }

  getSuggests(type, text): Observable<any[]> {
    return this.api.getSuggests(type, text || '');
  }

  handleReset(event) {
    event.stopPropagation();
    this.value = { id: '', code: '', type: this.type, value: '' };
  }

  handleOpen(event) {
    event.stopPropagation();
    this.router.navigate([this.value.type, this.value.id]);
  }

  handleSearch(event) {
    event.stopPropagation();
    this.dialog.open(SuggestDialogComponent, { data: { docType: this.value.type, docID: this.value.id }, panelClass: 'suggestDialog' })
      .afterClosed()
      .filter(result => !!result)
      .take(1)
      .subscribe((data: DocModel) => {
        this.value = { id: data.id, code: data.code, type: data.type, value: data.description };
      });
  }

}


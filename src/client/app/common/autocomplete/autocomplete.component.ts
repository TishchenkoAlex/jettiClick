import { DocModel } from '../_doc.model';
import { Component, ElementRef, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ApiService } from '../../services/api.service';
import { MdAutocompleteSelectedEvent, MdDialog } from '@angular/material';
import { JettiComplexObject } from '../../common/dynamic-form/dynamic-form-base';
import { SuggestDialogComponent } from './../../dialog/suggest.dialog.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'j-autocomplete',
  template: `
    <md-form-field fxFlex>
      <input #control mdInput [(ngModel)]="value" [required]="required"
        [placeholder]="placeholder" [mdAutocomplete]="auto" [readOnly]="readOnly"
        [disabled]="disabled" (blur)="onBlur()">
      <button *ngIf="showSearchSpinner" md-icon-button mdSuffix><md-spinner></md-spinner></button>
      <button md-icon-button mdSuffix type="button" style="cursor: pointer" mdTooltip="open search dialog" [mdTooltipShowDelay]="1000"
        (click)="handleSearch($event)" [tabIndex]=-1 autocomplete="off"><md-icon>search</md-icon></button>
      <button md-icon-button mdSuffix type="button" style="cursor: pointer" mdTooltip="open item card" [mdTooltipShowDelay]="1000"
        (click)="handleOpen($event)" [tabIndex]=-1 autocomplete="off"><md-icon>visibility</md-icon></button>
      <button md-icon-button mdSuffix type="button" style="cursor: pointer" mdTooltip="clear this field" [mdTooltipShowDelay]="1000"
        (click)="handleReset($event)" [tabIndex]=-1><md-icon>clear</md-icon></button>
    </md-form-field>

    <md-autocomplete #auto="mdAutocomplete" [displayWith]="displayFn">
     <md-option *ngFor="let value of suggests$ | async " [value]="value">
      <span>{{ value.value }}</span>
      <span> ({{value.code}}) </span>
    </md-option>
  </md-autocomplete>`,
  styles: [`md-spinner {width: 13px; height: 13px; position: relative; top: 2px; left: 0px; opacity: 1.0;}`],
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

  private _value: JettiComplexObject;
  @Input() set value(obj) {
    if (typeof obj !== 'string') {
      this._value = obj;
      this.onChange(this._value);
    }
  }
  get value() { return this._value; }
  @ViewChild('control') control: ElementRef;

  suggests$: Observable<any[]>;
  showSearchSpinner = false;

  // implement ControlValueAccessor interface
  private onChange = (value: any) => { };
  private onTouched = () => { };

  writeValue(obj: any): void {
    if (obj !== this._value) {
      this.value = obj;
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
    return c.valid ? null : {'not valid': true}
  };

  constructor(private api: ApiService, private router: Router, public dialog: MdDialog) { }

  ngOnInit() {
    this.suggests$ = Observable.fromEvent(this.control.nativeElement, 'keyup')
      .debounceTime(400)
      .map((event) => this.control.nativeElement.value)
      .distinctUntilChanged()
      .do(() => { this.showSearchSpinner = true; })
      .switchMap(text => this.getSuggests(this.value.type, text))
      .catch(err => { this.showSearchSpinner = false; return Observable.of<any[]>([]) })
      .do(() => { this.showSearchSpinner = false; });
  }

  onBlur() {
    if (this.control.nativeElement.value !== this.value.value) {
      this.value = Object.assign({}, this._value);
    }
  }

  displayFn(value: any): string {
    return value && typeof value === 'object' ? value.value : value;
  }

  getSuggests(type, text): Observable<any[]> {
    return this.api.getSuggests(type, text || '');
  }

  handleReset(event) {
    event.stopPropagation();
    this.value = { id: '', code: '', value: '', type: this.value.type };
  }

  handleOpen(event) {
    event.stopPropagation();
    this.router.navigate([this.value.type, this.value.id]);
  }

  handleSearch(event) {
    event.stopPropagation();
    this.dialog.open(SuggestDialogComponent, { hasBackdrop: true, data: { docType: this.value.type, docID: this.value.id } })
    .afterClosed()
    .filter(result => !!result)
    .subscribe((data: DocModel) => {
      this.value = {id: data.id, value: data.description, code: data.code, type: data.type};
    });
  }

}


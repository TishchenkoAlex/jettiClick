import { Component, Input, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormGroupDirective, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { MdAutocompleteTrigger, MdAutocompleteSelectedEvent } from '@angular/material';
import { BaseDynamicControl } from './dynamic-form-base';
import { ApiService } from '../../services/api.service';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'df-control',
  templateUrl: './dynamic-form-control.component.html',
  styles: [`md-spinner {width: 13px; height: 13px; position: relative; top: 2px; left: 0px; opacity: 1.0;}`]
})
export class DynamicFormControlComponent implements OnInit, AfterViewInit {
  @Input() control: BaseDynamicControl<any>;
  @Input() form: FormGroup;
  get isValid() { return this.form.controls[this.control.key].valid; }
  suggestsReactive: Observable<any[]>;
  showSearchSpinner = false;

  constructor(private http: ApiService, private router: Router) { }

  validateAutoComplete(control: FormControl): { [s: string]: boolean } {
    const result = !(typeof control.value === 'object');
    if (result) { return { 'value is not database object': result }; };
    return null;
  }

  displayFn(value: any): string {
    return value && typeof value === 'object' ? value.value : value;
  }

  getSuggests(type, text): Observable<any[]> {
    return this.http.getSuggests(type, text || '');
  }

  handleReset(event) {
    event.stopPropagation();
    this.form.controls[this.control.key].setValue('');
  }

  handleOpen(event) {
    event.stopPropagation();
    const docType = this.form.controls[this.control.key].value.type || this.control.type;
    const docID = this.form.controls[this.control.key].value.id;
    this.router.navigate([docType, docID])
  }

  ngOnInit() {
    if (this.control.controlType === 'autocomplete') {
      this.suggestsReactive = this.form.controls[this.control.key].valueChanges
        .debounceTime(400)
        .distinctUntilChanged()
        .filter(() => typeof this.form.controls[this.control.key].value !== 'object')
        .do(() => { this.showSearchSpinner = true; })
        .map(val => this.displayFn(val))
        .switchMap(text => this.getSuggests(this.control['type'], text))
        .catch(err => { this.showSearchSpinner = false; return Observable.of<any[]>([]) })
        .do(() => {
          this.showSearchSpinner = false;
        });
    }
  }

  optionSelected(event: MdAutocompleteSelectedEvent) {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.control.controlType === 'autocomplete') {
        this.form.controls[this.control.key].setValidators(this.validateAutoComplete);
      }
    });
  }

}


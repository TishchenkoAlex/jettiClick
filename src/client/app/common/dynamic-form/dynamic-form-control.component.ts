import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { MdAutocompleteTrigger } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BaseDynamicControl } from './dynamic-form-base';
import { Component, Input, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormGroupDirective, NgForm, NgModel } from '@angular/forms';

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
  @ViewChild(MdAutocompleteTrigger) trigger: MdAutocompleteTrigger;
  suggestsReactive: Observable<any[]>;
  showSearchSpinner = false;

  constructor(private http: ApiService, private router: Router) { }

  myErrorStateMatcher(control: FormControl, form: FormGroupDirective | NgForm): boolean {
    return !(typeof control.value === 'object')
    /*         console.log( control.dirty, control.touched, control.value, control.valid);
            const hasInteraction = control.dirty || control.touched;
            const isInvalid = control.invalid && (typeof control.value === 'object');
            return !!(hasInteraction && isInvalid); */
  }

  displayFn(value: any): string {
    return value && typeof value === 'object' ? value.value : value;
  }

  getSuggests(type, text): Observable<any[]> {
    return this.http.getSuggests(type, text || '');
  }

  handleReset(control: FormControl) {
    this.form.controls[this.control.key].setValue('');
  }

  handleOpen() {
    const docType = this.form.controls[this.control.key].value.type;
    const docID = this.form.controls[this.control.key].value.id;
    this.router.navigateByUrl(`${docType}/${docID}`)
  }

  ngOnInit() {
    if (this.control.controlType === 'autocomplete') {
      this.suggestsReactive = this.form.controls[this.control.key].valueChanges
        .debounceTime(400)
        .distinctUntilChanged()
        .do(() => { this.showSearchSpinner = true })
        .map(val => this.displayFn(val))
        .switchMap(name => this.getSuggests(this.control['type'], name))
        .catch(err => { this.showSearchSpinner = false; return Observable.of<any[]>([])})
        .do(() => { this.showSearchSpinner = false });
    }
  }

  ngAfterViewInit() {
  }
}


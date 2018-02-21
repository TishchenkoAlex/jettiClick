import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { getViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { BaseDocFormComponent } from '../../common/form/base.form.component';
import { FormControl } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<j-form></j-form>`
})
export class OperationFormComponent implements AfterViewInit, OnDestroy {
  private _subscription$: Subscription = Subscription.EMPTY;

  get viewModel() { return this.super.viewModel; }
  set viewModel(value) { this.super.viewModel = value; }
  @ViewChild(BaseDocFormComponent) super: BaseDocFormComponent;

  ngAfterViewInit() {
    console.log(this.super.viewModel);
    this._subscription$.unsubscribe();
    this._subscription$ = this.viewModel.formGroup.controls['Operation'].valueChanges.subscribe(v => this.update(v));

    this.super.Save = (doc = this.super.model, close = false) => {
      const additional1 = Object.keys(this.viewModel.schema).find(k => this.viewModel.schema[k].additional === 1);
      if (additional1) {
        const value = this.super.form.get(additional1).value;
        (this.super.form.get('p1') as FormControl).patchValue(value, {emitEvent: false});
      }
      const additional2 = Object.keys(this.viewModel.schema).find(k => this.viewModel.schema[k].additional === 2);
      if (additional2) {
        const value = this.super.form.get(additional2).value;
        (this.super.form.get('p2') as FormControl).patchValue(value, {emitEvent: false});
      }
      this.super.showDescription();
      this.super.ds.save(doc, close);
    };
  }

  update = async (value) => {
    const operation = await this.super.ds.api.getRawDoc(value.id).toPromise() || { doc: { Parameters: [] } };
    const view = this.super.docModel.Props();
    const Parameters = operation.doc['Parameters'];
    let i = 1;
    Parameters.sort((a, b) => a.order > b.order).forEach(c => view[c.parameter] = {
      label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
      [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null,
      additional: c.type.startsWith('Catalog.') ? i++ : null
    });
    this.viewModel = getViewModel(view, this.super.model, true);
    this.ngAfterViewInit();
    this.super.cd.detectChanges();
  }


  ngOnDestroy = () => this._subscription$.unsubscribe();
}

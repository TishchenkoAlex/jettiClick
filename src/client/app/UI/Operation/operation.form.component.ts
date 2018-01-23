import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { getViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { BaseDocFormComponent } from '../../common/form/base.form.component';

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
    this._subscription$.unsubscribe();
    this._subscription$ = this.viewModel.formGroup.controls['Operation'].valueChanges.subscribe(v => this.update(v));
  }

  update = async (value) => {
    const operation = await this.super.ds.api.getRawDoc(value.id).toPromise() || { doc: { Parameters: [] } };
    const view = this.super.docModel.Props();
    const Parameters = operation.doc['Parameters'];
    Parameters.sort((a, b) => a.order > b.order).forEach(c => view[c.parameter] = {
      label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
      [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null
    });
    this.viewModel = getViewModel(view, this.super.model, true);
    this.ngAfterViewInit();
    this.super.cd.detectChanges();
  }

  ngOnDestroy = () => this._subscription$.unsubscribe();
}

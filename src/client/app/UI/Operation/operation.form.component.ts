import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { getFormGroup } from '../../common/dynamic-form/dynamic-form.service';
import { BaseDocFormComponent } from '../../common/form/base.form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<j-form></j-form>`
})
export class OperationFormComponent implements AfterViewInit, OnDestroy {
  private _subscription$: Subscription = Subscription.EMPTY;
  private view;
  private metadata;

  get form() { return this.super.form; }
  set form(value) { this.super.form = value; }
  @ViewChild(BaseDocFormComponent) super: BaseDocFormComponent;

  ngAfterViewInit() {
    if (!this.view) this.view = { ...this.form['schema'] };
    if (!this.metadata) this.metadata = { ...this.form['metadata'] };

    this._subscription$.unsubscribe();
    this._subscription$ = this.form.get('Operation').valueChanges
      .subscribe(v => this.update(v).then(() => this.super.cd.detectChanges()));
  }

  update = async (value) => {
    const operation = value.id ?
      await this.super.ds.api.getRawDoc(value.id) :
      { doc: { Parameters: [] } };
    const view = {};
    const Parameters = operation.doc['Parameters'] || [];
    Parameters.sort((a, b) => a.order - b.order).forEach(c => view[c.parameter] = {
      label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
      [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null, ...JSON.parse(c.Props ? c.Props : '{}')
    });
    this.form = getFormGroup({ ...this.view, ...view }, this.super.model, true);
    this.form['metadata'] = this.metadata;
    this.ngAfterViewInit();
    this.super.cd.detectChanges();
  }

  Close = () => this.super.Close();
  focus = () => this.super.focus();

  ngOnDestroy = () => this._subscription$.unsubscribe();
}

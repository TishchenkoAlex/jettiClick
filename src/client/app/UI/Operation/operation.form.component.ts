import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { createDocument } from '../../../../server/models/documents.factory';
import { DocumentOperation } from '../../../../server/models/Documents/Document.Operation';
import { FormControlInfo } from '../../common/dynamic-form/dynamic-form-base';
import { getFormGroup } from '../../common/dynamic-form/dynamic-form.service';
import { BaseDocFormComponent } from '../../common/form/base.form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<j-form></j-form>`
})
export class OperationFormComponent implements AfterViewInit, OnDestroy {
  private _subscription$: Subscription = Subscription.EMPTY;

  get form() { return this.super.form; }
  set form(value) { this.super.form = value; }
  @ViewChild(BaseDocFormComponent) super: BaseDocFormComponent;

  ngAfterViewInit() {
    this._subscription$.unsubscribe();
    this._subscription$ = this.form.get('Operation').valueChanges
      .subscribe(v => this.update(v).then(() => this.super.cd.detectChanges()));
  }

  update = async (value) => {
    const operation = value.id ? await this.super.ds.api.getRawDoc(value.id) : { doc: { Parameters: [] } };
    const view = {};
    const Parameters = operation.doc['Parameters'] || [];
    Parameters.sort((a, b) => a.order - b.order).forEach(c => view[c.parameter] = {
      label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
      [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null, ...JSON.parse(c.Props ? c.Props : '{}')
    });

    // restore original state of Operation
    const doc = createDocument<DocumentOperation>('Document.Operation');
    const docKeys = Object.keys(doc.Props());
    Object.keys(this.form.controls).forEach(c => {
      if (!docKeys.includes(c)) {
        this.form.removeControl(c);
        delete this.form['byKeyControls'][c];
        const index = (this.form['orderedControls'] as FormControlInfo[]).findIndex(el => el.key === c);
        (this.form['orderedControls'] as FormControlInfo[]).splice(index, 1);
      }
    });

    // add dynamic formControls to Operation
    const formOperation = getFormGroup(view, this.super.model, true);
    const orderedControls = formOperation['orderedControls']  as FormControlInfo[];
    orderedControls.forEach(c => {
      this.form.addControl(c.key, formOperation.controls[c.key]);
      this.form['byKeyControls'][c.key] = formOperation['byKeyControls'][c.key];
    });
    (this.form['orderedControls'] as FormControlInfo[]).splice(7, 0, ...orderedControls);
    this.form['metadata'] = doc.Prop();

    this.ngAfterViewInit();
    this.super.cd.detectChanges();
  }

  Close = () => this.super.Close();
  focus = () => this.super.focus();

  ngOnDestroy() {
    this._subscription$.unsubscribe();
  }
}

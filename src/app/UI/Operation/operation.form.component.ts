import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { v1 } from 'uuid';
import { DocumentOperation } from '../../../../server/models/Documents/Document.Operation';
import { DocumentOptions } from '../../../../server/models/document';
import { createDocument } from '../../../../server/models/documents.factory';
import { FormControlInfo } from '../../common/dynamic-form/dynamic-form-base';
import { getFormGroup } from '../../common/dynamic-form/dynamic-form.service';
import { BaseDocFormComponent } from '../../common/form/base.form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <j-form>
    <div *ngIf="copyTo.length && !this.super.isNew">
      <br>
      <div fxLayout="row">
        <button *ngFor="let m of copyTo"
          pButton type="button" id=[m.id] icon="fa-share" [label]="m.description" class="ui-button-primary" (click)="baseOn(m)">
        </button>
      </div>
    </div>
  </j-form>`
})
export class OperationFormComponent implements AfterViewInit, OnDestroy {
  private _subscription$: Subscription = Subscription.EMPTY;

  get form() { return this.super.form; }
  set form(value) { this.super.form = value; }
  get Operation() { return this.form.get('Operation')!; }

  @ViewChild(BaseDocFormComponent) super: BaseDocFormComponent;

  copyTo: {id: string, description: string}[] = [];

  async ngAfterViewInit() {
    this.copyTo = [];
    const OperationID = this.Operation.value;
    const Operation = OperationID && OperationID.id ? await this.super.ds.api.getRawDoc(OperationID.id) : { doc: { Parameters: [] } };
    for (const o of (Operation['CopyTo'] || [])) {
      const item = { id: o.Operation, description: (await this.super.ds.api.getRawDoc(o.Operation)).description };
      this.copyTo.push(item);
    }
    this.form['metadata']['copyTo'] = this.copyTo;
    this._subscription$.unsubscribe();
    this._subscription$ = this.Operation.valueChanges
      .subscribe(v => this.update(v).then(() => this.super.cd.detectChanges()));
  }

  baseOn(m) {
    this.super.router.navigate([this.super.type, v1()],
      { queryParams: { base: this.super.id, Operation: m.id } });
  }

  update = async (value) => {
    const oldValue = Object.assign({}, this.super.model);

    const Operation = value.id ? await this.super.ds.api.getRawDoc(value.id) : { doc: { Parameters: [] } };
    const view = {};
    const Parameters = Operation['Parameters'] || [];
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
    const formOperation = getFormGroup(view, oldValue, true);
    const orderedControls = formOperation['orderedControls'] as FormControlInfo[];
    orderedControls.forEach(c => {
      this.form.addControl(c.key, formOperation.controls[c.key]);
      this.form['byKeyControls'][c.key] = formOperation['byKeyControls'][c.key];
    });
    (this.form['orderedControls'] as FormControlInfo[]).splice(7, 0, ...orderedControls);
    const Prop = doc.Prop() as DocumentOptions;
    this.form['metadata'] = {...Prop};

    this.super.cd.markForCheck();
    this.ngAfterViewInit();
  }

  Close = () => this.super.Close();
  focus = () => this.super.focus();

  ngOnDestroy() {
    this._subscription$.unsubscribe();
  }
}

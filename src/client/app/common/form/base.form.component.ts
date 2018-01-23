import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { merge } from 'rxjs/observable/merge';
import { of as observableOf } from 'rxjs/observable/of';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { DocumentBase, DocumentOptions } from '../../../../server/models/document';
import { createDocument } from '../../../../server/models/documents.factory';
import { DocService } from '../../common/doc.service';
import { ViewModel } from '../../common/dynamic-form/dynamic-form.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-form',
  templateUrl: './base.form.component.html'
})
export class BaseDocFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  @Input() viewModel: ViewModel = this.route.data['value'].detail;
  paramID = this.route.params['value'].id as string;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;
  private _descriptionSubscription$: Subscription = Subscription.EMPTY;

  get model() { return this.viewModel.formGroup.getRawValue() as DocumentBase; }
  docModel: DocumentBase = createDocument(this.model.type);
  get controls() { return this.viewModel.formGroup.controls; }
  get hasTables() { return this.viewModel.view.find(t => t.type === 'table'); }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table'); }
  get description() { return this.controls.description as FormControl; }
  get isPosted() { return this.controls.posted.value as boolean; }
  get isDeleted() { return this.controls.deleted.value as boolean; }
  get isDoc() { return this.docModel.isDoc; }
  get isNew() { return this.paramID.startsWith('new'); }
  get isCopy() { return this.paramID.startsWith('copy'); }
  get isFolder() { return (!!this.controls['isfolder'].value); }
  docDescription = (this.docModel.Prop() as DocumentOptions).description;
  relations = (this.docModel.Prop() as DocumentOptions).relations || [];

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, public location: Location) { }

  ngOnInit() {
    this._subscription$ = merge(...[
      this.ds.save$,
      this.ds.delete$]).pipe(
      filter(doc => (doc.id === this.model.id) && (doc.isfolder !== true)))
      .subscribe(doc => {
        this.viewModel.formGroup.patchValue(doc, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
      });

    this._saveCloseSubscription$ = this.ds.saveClose$.pipe(
      filter(doc => doc.id === this.model.id))
      .subscribe(doc => {
        this.viewModel.formGroup.patchValue(doc, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
        this.Close();
      });

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.model.type && data.id === this.paramID))
      .subscribe(data => this.Close());

    this._descriptionSubscription$ = merge(...[
      this.controls.date.valueChanges,
      this.controls.code.valueChanges,
      this.controls.Group ?
        this.controls.Group.valueChanges : observableOf('')]).pipe(
      filter(() => this.docModel.isDoc))
      .subscribe(data => {
        const doc = this.model;
        const Group = doc['Group'] ? '(' + doc['Group'].value + ')' : '';
        const value = `${this.docDescription} ${Group} #${doc.code}, ${doc.date.toISOString()}`;
        this.description.patchValue(value, { emitEvent: false, onlySelf: true });
      });
  }

  Save() { this.ds.save(this.model); }
  Delete() { this.ds.delete(this.model.id); }
  Copy() { return this.router.navigate([this.model.type, 'copy-' + this.model.id]); }
  Post() { const doc = this.model; doc.posted = true; this.ds.save(doc); }
  unPost() { const doc = this.model; doc.posted = false; this.ds.save(doc); }
  PostClose() { const doc = this.model; doc.posted = true; this.ds.save(doc, true); }
  Goto() {
    return this.router.navigate([this.model.type], { queryParams: { goto: this.model.id }, replaceUrl: true })
      .then(() => this.ds.goto$.next(this.model));
  }

  private _close() {
    this.ds.close$.next(null);
    this.cd.markForCheck();
    this.location.back();
  }

  Close() {
    if (this.viewModel.formGroup.pristine) { this._close(); return; }
    this.ds.confirmationService.confirm({
      message: 'Discard changes and close?',
      header: 'Confirmation',
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      reject: () => { this.cd.markForCheck(); },
      key: this.paramID
    });
    this.cd.markForCheck();
  }

  Print() {
    // const url = 'https://pharm.yuralex.com/ReportServer/Pages/ReportViewer.aspx';
    // window.open(`${url}?%2fReport+Project1%2fReport1&rs:Command=Render&invoiceID=${this.docId}`, 'Print');
  }

  async onCommand(event) {
    const result = await this.ds.api.onCommand(this.model, 'company', { Tax: -11 });
    this.viewModel.formGroup.patchValue(result);
  }

  async getPrice() {
    const result = await this.ds.api.server(this.model, 'GetPrice', {}).toPromise();
    this.viewModel.formGroup.patchValue(result.doc);
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
    this._descriptionSubscription$.unsubscribe();
  }

}

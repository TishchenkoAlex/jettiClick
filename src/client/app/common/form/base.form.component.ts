import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { merge } from 'rxjs/observable/merge';
import { of as observableOf } from 'rxjs/observable/of';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { calculateDescription } from '../../../../server/models/api';
import { DocumentBase, DocumentOptions } from '../../../../server/models/document';
import { createDocument } from '../../../../server/models/documents.factory';
import { DocService } from '../../common/doc.service';
import { ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { TabsStore } from '../tabcontroller/tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-form',
  templateUrl: './base.form.component.html'
})
export class BaseDocFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  @Input() viewModel: ViewModel = this.route.snapshot.data.detail;
  paramID = this.route.snapshot.params.id as string;
  paramTYPE = this.route.snapshot.params.type as string;
  form = this.viewModel.formGroup;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;
  private _descriptionSubscription$: Subscription = Subscription.EMPTY;

  get model() { return this.form.getRawValue() as DocumentBase; }
  docModel: DocumentBase = createDocument(this.model.type);
  get hasTables() { return this.viewModel.view.find(t => t.type === 'table'); }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table'); }
  get description() { return <FormControl>this.form.get('description'); }
  get isPosted() { return <boolean>this.form.get('posted').value; }
  get isDeleted() { return <boolean>this.form.get('deleted').value; }
  isDoc = this.docModel.isDoc;
  get isNew() { return !this.form.get('timestamp').value; }
  isCopy = this.paramID.startsWith('copy');
  get isFolder() { return (!!this.form.get('isfolder').value); }
  docDescription = (this.docModel.Prop() as DocumentOptions).description;
  relations = (this.docModel.Prop() as DocumentOptions).relations || [];

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, public location: Location, public tabStore: TabsStore) { }

  ngOnInit() {
    this._subscription$ = merge(...[
      this.ds.save$,
      this.ds.delete$]).pipe(
        filter(doc => (doc.id === this.model.id) && (doc.isfolder !== true)))
      .subscribe(doc => {
        this.viewModel.formGroup.patchValue(doc, { emitEvent: false });
        if (this.docModel.isDoc) { this.showDescription(); }
        this.viewModel.formGroup.markAsPristine();
        this.cd.detectChanges();
      });

    this.ds.saveClose$.pipe(
      filter(doc => doc.id === this.model.id))
      .subscribe(doc => {
        this.viewModel.formGroup.markAsPristine();
        this.Close();
      });

    this._descriptionSubscription$ = merge(...[
      this.form.get('date').valueChanges,
      this.form.get('code').valueChanges,
      this.form.get('Group') ?
        this.form.get('Group').valueChanges : observableOf('')]).pipe(
          filter(() => this.docModel.isDoc))
      .subscribe(data => this.showDescription());
  }

  showDescription() {
    if (this.isDoc) {
      const date = this.form.get('date').value;
      const code = this.form.get('code').value;
      const group = this.form.get('Group') && this.form.get('Group').value ? this.form.get('Group').value.value : '';
      const value = calculateDescription(this.docDescription, date, code, group);
      this.description.patchValue(value, { emitEvent: false, onlySelf: true });
    }
  }

  Save(doc = this.model, close = false) { this.showDescription(); this.ds.save(doc, close); }
  Delete() { this.ds.delete(this.model.id); }
  Copy() { return this.router.navigate([this.model.type, this.model.id], { queryParams: { command: 'copy' } }); }
  Post() { const doc = this.model; doc.posted = true; this.Save(doc); }
  unPost() { const doc = this.model; doc.posted = false; this.Save(doc); }
  PostClose() { const doc = this.model; doc.posted = true; this.Save(doc, true); }

  Goto() {
    return this.router.navigate([this.model.type], { queryParams: { goto: this.model.id }, replaceUrl: true })
      .then(() => this.ds.goto$.next(this.model));
  }

  private _close() {
    this.tabStore.close(this.tabStore.state.tabs[this.tabStore.selectedIndex]);
  }

  Close() {
    if (this.viewModel.formGroup.pristine) { this._close(); return; }
    this.ds.confirmationService.confirm({
      message: 'Discard changes and close?',
      header: 'Confirmation',
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      key: this.paramID
    });
    this.cd.detectChanges();
  }

  Print = () => { };

  async onCommand(event) {
    const result = await this.ds.api.onCommand(this.model, 'company', { Tax: -11 });
    this.viewModel.formGroup.patchValue(result);
  }

  async getPrice() {
    const result = await this.ds.api.docMethodOnServer(this.model, 'GetPrice', {}).toPromise();
    this.viewModel.formGroup.patchValue(result.doc);
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
    this._descriptionSubscription$.unsubscribe();
  }

}

import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { merge } from 'rxjs/observable/merge';
import { of as observableOf } from 'rxjs/observable/of';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { calculateDescription } from '../../../../server/models/api';
import { DocumentBase } from '../../../../server/models/document';
import { DocService } from '../../common/doc.service';
import { FormControlInfo } from '../dynamic-form/dynamic-form-base';
import { LoadingService } from '../loading.service';
import { TabsStore } from '../tabcontroller/tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-form',
  templateUrl: './base.form.component.html'
})
export class BaseDocFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  @Input() id = this.route.snapshot.params.id as string;
  @Input() type = this.route.snapshot.params.type as string;
  @Input() form: FormGroup = this.route.snapshot.data.detail;

  get model() { return this.form.getRawValue() as DocumentBase; }

  isDoc = this.type.startsWith('Document.');
  isCopy = this.route.snapshot.queryParams.command === 'copy';
  docDescription = <string>this.form['metadata'].description;
  relations = this.form['metadata'].relations || [];
  schema = this.form['schema'] || {};
  get v() { return <FormControlInfo[]>this.form['orderedControls']; }
  get vk() { return <{ [key: string]: FormControlInfo }>this.form['byKeyControls']; }
  get viewModel() { return this.form.getRawValue(); }
  get hasTables() { return !!(<FormControlInfo[]>this.form['orderedControls']).find(t => t.type === 'table'); }
  get tables() { return (<FormControlInfo[]>this.form['orderedControls']).filter(t => t.type === 'table'); }
  get description() { return <FormControl>this.form.get('description'); }
  get isPosted() { return <boolean>!!this.form.get('posted').value; }
  get isDeleted() { return <boolean>!!this.form.get('deleted').value; }
  get isNew() { return !this.form.get('timestamp').value; }
  get isFolder() { return (!!this.form.get('isfolder').value); }

  private _subscription$: Subscription = Subscription.EMPTY;
  private _descriptionSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia, public lds: LoadingService,
    public cd: ChangeDetectorRef, public ds: DocService, public location: Location, public tabStore: TabsStore) { }

  ngOnInit() {
    this._subscription$ = merge(...[
      this.ds.save$,
      this.ds.delete$]).pipe(
        filter(doc => (doc.id === this.id) && (doc.isfolder !== true)))
      .subscribe(doc => {
        this.form.patchValue(doc, { emitEvent: false });
        if (this.isDoc) { this.showDescription(); }
        this.form.markAsPristine();
        this.cd.detectChanges();
      });

    this._saveCloseSubscription$ = this.ds.saveClose$.pipe(
      filter(doc => doc.id === this.id))
      .subscribe(doc => {
        this.form.markAsPristine();
        this.Close();
      });

    this._descriptionSubscription$ = merge(...[
      this.form.get('date').valueChanges,
      this.form.get('code').valueChanges,
      this.form.get('Group') ?
        this.form.get('Group').valueChanges : observableOf('')]).pipe(
          filter(() => this.isDoc))
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
    return this.router.navigate([this.model.type], { queryParams: { goto: this  .id }, replaceUrl: true });
  }

  private _close() {
    const tab = this.tabStore.state.tabs.find(t => t.docID === this.id);
    if (tab) {
      this.tabStore.close(tab);
      const parentTab = this.tabStore.state.tabs.find(t => t.docType === this.type && !t.docID);
      if (parentTab) {
        this.router.navigate([parentTab.docType, parentTab.docID]);
      } else {
        const returnTab = this.tabStore.state.tabs[this.tabStore.selectedIndex];
        this.router.navigate([returnTab.docType, returnTab.docID]);
      }
    }
  }

  Close() {
    if (this.form.pristine) { this._close(); return; }
    this.ds.confirmationService.confirm({
      message: 'Discard changes and close?',
      header: 'Confirmation',
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      key: this.id
    });
    this.cd.detectChanges();
  }

  Print = () => { };

  async onCommand(event) {
    const result = await this.ds.api.onCommand(this.model, 'company', { Tax: -11 });
    this.form.patchValue(result);
  }

  async getPrice() {
    const result = await this.ds.api.docMethodOnServer(this.model, 'GetPrice', {}).toPromise();
    this.form.patchValue(result.doc);
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._descriptionSubscription$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
  }

}

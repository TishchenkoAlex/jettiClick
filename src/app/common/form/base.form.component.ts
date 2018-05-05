import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/components/common/menuitem';
import { Subscription, merge, of as observableOf } from 'rxjs';
import { filter } from 'rxjs/operators';
import { v1 } from 'uuid';
import { calculateDescription } from '../../../../server/models/api';
import { DocumentBase, DocumentOptions, Ref } from '../../../../server/models/document';
import { DocService } from '../../common/doc.service';
import { FormControlInfo } from '../dynamic-form/dynamic-form-base';
import { patchOptionsNoEvents } from '../dynamic-form/dynamic-form.service';
import { LoadingService } from '../loading.service';
import { TabsStore } from '../tabcontroller/tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-form',
  templateUrl: './base.form.component.html'
})
export class BaseDocFormComponent implements OnInit, OnDestroy {

  @Input() id = this.route.snapshot.params.id as string;
  @Input() type = this.route.snapshot.params.type as string;
  @Input() form: FormGroup = this.route.snapshot.data.detail;
  @ViewChildren(CdkTrapFocus) cdkTrapFocus: QueryList<CdkTrapFocus>;

  get model() { return this.form.getRawValue() as DocumentBase; }

  isDoc = this.type.startsWith('Document.');
  isCopy = this.route.snapshot.queryParams.command === 'copy';
  get docDescription() { return <string>this.form['metadata'].description; }
  get metadata() { return <DocumentOptions>this.form['metadata']; }
  get relations() { return this.form['metadata'].relations || []; }
  get v() { return <FormControlInfo[]>this.form['orderedControls']; }
  get vk() { return <{ [key: string]: FormControlInfo }>this.form['byKeyControls']; }
  get viewModel() { return this.form.getRawValue(); }
  get hasTables() { return !!(<FormControlInfo[]>this.form['orderedControls']).find(t => t.type === 'table'); }
  get tables() { return (<FormControlInfo[]>this.form['orderedControls']).filter(t => t.type === 'table'); }
  get description() { return <FormControl>this.form.get('description'); }
  get isPosted() { return <boolean>!!this.form.get('posted')!.value; }
  get isDeleted() { return <boolean>!!this.form.get('deleted')!.value; }
  get isNew() { return !this.form.get('timestamp')!.value; }
  get isFolder() { return (!!this.form.get('isfolder')!.value); }
  get commands() { return (<MenuItem[]>this.form['metadata']['commandsOnServer']) || []; }
  get copyTo() { return (<MenuItem[]>this.form['metadata']['copyTo']) || []; }

  private _subscription$: Subscription = Subscription.EMPTY;
  private _descriptionSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;

  constructor(public router: Router, public route: ActivatedRoute, public lds: LoadingService,
    public cd: ChangeDetectorRef, public ds: DocService, public location: Location, public tabStore: TabsStore) { }

  ngOnInit() {
    this._subscription$ = merge(...[this.ds.save$, this.ds.delete$]).pipe(
      filter(doc => doc.id === this.id))
      .subscribe(doc => {
        this.form.patchValue(doc, patchOptionsNoEvents);
        if (this.isDoc) { this.showDescription(); }
        this.form.markAsPristine();
      });

    this._saveCloseSubscription$ = this.ds.saveClose$.pipe(
      filter(doc => doc.id === this.id))
      .subscribe(doc => {
        this.form.markAsPristine();
        this.Close();
      });

    this._descriptionSubscription$ = merge(...[
      this.form.get('date')!.valueChanges,
      this.form.get('code')!.valueChanges,
      this.form.get('Group') ? this.form.get('Group')!.valueChanges : observableOf('')])
      .pipe(filter(_ => this.isDoc)).subscribe(_ => this.showDescription());
  }

  showDescription() {
    if (this.isDoc) {
      const date = this.form.get('date')!.value;
      const code = this.form.get('code')!.value;
      const group = this.form.get('Group') && this.form.get('Group')!.value ? this.form.get('Group')!.value.value : '';
      const value = calculateDescription(this.docDescription, date, code, group);
      this.description.patchValue(value, patchOptionsNoEvents);
    }
  }

  Save(doc = this.model, mode: 'save' | 'post' = 'save', close = false, ) { this.showDescription(); this.ds.save(doc, close, mode); }
  Delete() { this.ds.delete(this.model.id); }
  Copy() { return this.router.navigate([this.model.type, v1().toUpperCase()], { queryParams: { copy: this.id } }); }
  Post() { const doc = this.model; doc.posted = true; this.Save(doc, 'post'); }
  unPost() { this.ds.unpost(this.id).then(() => this.form.get('posted')!.patchValue(false, patchOptionsNoEvents)); }
  PostClose() { const doc = this.model; doc.posted = true; this.Save(doc, 'post', true); }

  Goto() {
    return this.router.navigate([this.model.type],
      { queryParams: { goto: this.id, posted: this.model.posted }, replaceUrl: true });
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
      header: 'Discard changes and close?',
      message: this.description.value,
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      reject: this.focus.bind(this),
      key: this.id
    });
    this.cd.detectChanges();
  }

  focus() {
    const autoCapture = this.cdkTrapFocus.find(el => el.autoCapture);
    if (autoCapture) autoCapture.focusTrap.focusFirstTabbableElementWhenReady();
  }

  Print = () => {
    throw new Error('Print not implemented!');
  }

  baseOn(id: Ref) {
    this.router.navigate([this.type, v1()],
      { queryParams: { base: this.id, Operation: id } });
  }

  commandOnSever(method: string) {
    this.ds.api.onCommand(this.form.value, method, {}).then(value => {
      this.form.patchValue(value || {}, patchOptionsNoEvents);
      this.cd.detectChanges();
    });
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._descriptionSubscription$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
  }

}

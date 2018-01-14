import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { merge } from 'rxjs/observable/merge';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../common/doc.service';
import { patchOptionsNoEvents, ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { DocumentBase } from '../../../../server/models/document';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-form',
  templateUrl: './base.form.component.html'
})
export class BaseDocFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  viewModel: ViewModel = this.route.data['value'].detail;
  docId = this.route.params['value'].id;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;

  get model() { return this.viewModel.formGroup.getRawValue() as DocumentBase; }
  get hasTables() { return this.viewModel.view.find(t => t.type === 'table'); }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table'); }
  get posted() { return this.viewModel.formGroup.controls['posted']; }
  get isPosted() { return this.viewModel.formGroup.controls['posted'].value as boolean; }
  get isDeleted() { return this.viewModel.formGroup.controls['deleted'].value as boolean; }
  get isDoc() { return (this.viewModel.formGroup.controls['type'].value as string).startsWith('Document.'); }
  get isNew() { return (this.viewModel.formGroup.controls['description'].value as string).startsWith('new'); }
  get isCopy() { return (this.viewModel.formGroup.controls['description'].value as string).startsWith('copy'); }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, private location: Location) { }

  ngOnInit() {
    this._subscription$ = merge(...[
      this.ds.save$,
      this.ds.delete$]).pipe(
      filter(doc => (doc.id === this.docId) && (doc.isfolder !== true)))
      .subscribe(savedDoc => {
        this.viewModel.formGroup.patchValue(savedDoc, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
      });

    this._saveCloseSubscription$ = this.ds.saveCloseDoc$.pipe(
      filter(doc => doc.id === this.model.id))
      .subscribe(savedDoc => {
        this.viewModel.formGroup.patchValue(savedDoc, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
        this.Close();
        this.Goto();
      });

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.model.type && data.id === this.docId))
      .subscribe(data => this.Close());
  }

  // tslint:disable:max-line-length
  Save = (close = false) => this.ds.save(this.model, close);
  Delete = () => this.ds.delete(this.model.id);
  Copy = () => this.router.navigate([this.model.type, 'copy-' + this.model.id]);
  Goto = () => this.router.navigate([this.model.type], { queryParams: { goto: this.docId }, replaceUrl: true }).then(() => this.ds.goto(this.model));
  Post() { this.posted.setValue(true, patchOptionsNoEvents); this.Save(); }
  PostClose() { this.posted.setValue(true, patchOptionsNoEvents); this.Save(true); }
  unPost() { this.posted.setValue(false, patchOptionsNoEvents); this.Save(); }

  private _close() {
    this.ds.close(null);
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
      key: this.docId
    });
    setTimeout(() => this.cd.markForCheck());
  }

  Print() {
    const url = 'https://pharm.yuralex.com/ReportServer/Pages/ReportViewer.aspx';
    window.open(`${url}?%2fReport+Project1%2fReport1&rs:Command=Render&invoiceID=${this.docId}`, 'Print');
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
  }

}

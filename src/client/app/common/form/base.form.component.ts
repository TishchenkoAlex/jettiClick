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
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../common/doc.service';
import { patchOptionsNoEvents, ViewModel } from '../../common/dynamic-form/dynamic-form.service';

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

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table') }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table') }
  get posted() { return this.viewModel.formGroup.controls['posted'] }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService,
    private location: Location) {
  }

  ngOnInit() {

    this._subscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$]).pipe(
      filter(doc => doc.id === this.docId))
      .subscribe(savedDoc => {
        this.viewModel.model = savedDoc;
        this.viewModel.formGroup.patchValue(this.viewModel.model, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
      });

    this._saveCloseSubscription$ = this.ds.saveCloseDoc$.pipe(
      filter(doc => doc.id === this.viewModel.model.id))
      .subscribe(savedDoc => {
        this.viewModel.model = savedDoc;
        this.viewModel.formGroup.patchValue(this.viewModel.model, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
        this.Goto();
        this.Close();
      });

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.viewModel.model.type && data.id === this.docId))
      .subscribe(data => this.Close())
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
  }

  private onSubmit(close = false) {
    this.viewModel.model = Object.assign(this.viewModel.model, this.viewModel.formGroup.getRawValue()); // ???
    this.ds.save(this.viewModel.model, close);
  }

  Save(close = false) {
    this.onSubmit(close);
  }

  Post() {
    this.posted.setValue(true, patchOptionsNoEvents);
    this.Save();
  }

  PostClose() {
    this.posted.setValue(true, patchOptionsNoEvents);
    this.Save(true);
  }

  unPost() {
    this.posted.setValue(false, patchOptionsNoEvents);
    this.Save();
  }

  Delete() {
    this.ds.delete(this.viewModel.model.id);
  }

  private _close() {
    this.ds.close(null);
    this.cd.markForCheck();
    this.location.back();
  };

  Close() {
    if (this.viewModel.formGroup.pristine) { this._close(); return }
    this.ds.confirmationService.confirm({
      message: 'Discard changes and close?',
      header: 'Confirmation',
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      reject: () => { this.cd.markForCheck() },
      key: this.docId
    });
    setTimeout(() => this.cd.markForCheck());
  }

  Copy() {
    this.router.navigate([this.viewModel.model.type, 'copy-' + this.viewModel.model.id]);
  }

  Goto() {
    this.router.navigate([this.viewModel.model.type], { queryParams: { goto: this.docId }, replaceUrl: true })
      .then(() => { this.ds.goto(this.viewModel.model) });
  }

  Print() {
    const url = 'https://pharm.yuralex.com/ReportServer/Pages/ReportViewer.aspx';
    window.open(`${url}?%2fReport+Project1%2fReport1&rs:Command=Render&invoiceID=${this.docId}`, 'Print');
  }

  async onCommand(event) {
    const result = await this.ds.api.onCommand(this.viewModel.formGroup.getRawValue(), 'company', { Tax: -11 });
    this.viewModel.formGroup.patchValue(result);
  }

  async getPrice() {
    const result = await this.ds.api.server(this.viewModel.model, 'GetPrice', {}).toPromise();
    this.viewModel.model = result.doc;
    this.viewModel.formGroup.patchValue(this.viewModel.model);
  }

}

import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../common/doc.service';
import { ViewModel } from '../../common/dynamic-form/dynamic-form.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-forms',
  templateUrl: './base.form.component.html'
})
export class BaseFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  viewModel: ViewModel = this.route.data['value'].detail;
  docId = Math.random().toString();

  private _subscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table') }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table') }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService,
    private location: Location) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
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

  async onCommand(event) {
    const result = await this.ds.api.onCommand(this.viewModel.formGroup.getRawValue(), 'company', { Tax: -11 });
    this.viewModel.formGroup.patchValue(result);
  }

  async Execute() {
    try {
      const result = await this.ds.api.call('Form.Post', this.viewModel.formGroup.getRawValue(), 'Execute', []).toPromise();
      this.viewModel.formGroup.patchValue(result);
    } catch (err) {
      this.ds.openSnackBar('error', 'Error on execute', err.error)
    }
  }

}

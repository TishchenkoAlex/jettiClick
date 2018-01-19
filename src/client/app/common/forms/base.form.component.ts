import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { AuthService } from '../../auth/auth.service';
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
  docType = this.route.snapshot.params.type;

  private _closeSubscription$: Subscription = Subscription.EMPTY;

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table'); }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table'); }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, private auth: AuthService) {
  }

  ngOnInit() {
    this.auth.userProfile$.pipe(take(1)).subscribe();

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.docType))
      .subscribe(data => this.Close());
  }

  ngOnDestroy() {
    this._closeSubscription$.unsubscribe();
  }

  private _close() {
    this.ds.close$.next(null);
    this.cd.markForCheck();
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

  async onCommand(event) {
    const result = await this.ds.api.onCommand(this.viewModel.formGroup.getRawValue(), 'company', { Tax: -11 });
    this.viewModel.formGroup.patchValue(result);
  }

  async Execute(mode = 'post') {
    const user = await this.auth.userProfile$.toPromise();
    const data = this.viewModel.formGroup.value;
    const result = await this.ds.api.jobAdd({
      job: { id: 'post', description: '(job) post Invoives' },
      userId: user ? user.account.email : null,
      type: data.type.id,
      company: data.company.id,
      StartDate: data.StartDate,
      EndDate: data.EndDate.setHours(23, 59, 59, 999)
    }/* , { jobId: 'FormPostServer', removeOnComplete: true, removeOnFail: true } */ ).toPromise();
  }

}

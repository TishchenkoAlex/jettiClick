import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService } from '../../auth/auth.service';
import { DocService } from '../../common/doc.service';
import { ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { TabsStore } from '../tabcontroller/tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-forms',
  templateUrl: './base.form.component.html'
})
export class BaseFormComponent implements OnInit {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  viewModel: ViewModel = this.route.snapshot.data.detail;
  paramID = Math.random().toString();
  paramTYPE = this.route.snapshot.params.type as string;
  form = this.viewModel.formGroup;

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table'); }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table'); }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, private auth: AuthService, public tabStore: TabsStore) { }

  ngOnInit() {
    this.auth.userProfile$.pipe(take(1)).subscribe();
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

  async Execute(): Promise<any> {
    const user = this.auth.userProfile;
    const data = this.viewModel.formGroup.value;
    return await this.ds.api.jobAdd({
      job: { id: 'post', description: '(job) post Invoives' },
      userId: user ? user.account.email : null,
      type: data.type.id,
      company: data.company.id,
      StartDate: data.StartDate,
      EndDate: data.EndDate.setHours(23, 59, 59, 999)
    }/* , { jobId: 'FormPostServer', removeOnComplete: true, removeOnFail: true } */).toPromise();
  }

}

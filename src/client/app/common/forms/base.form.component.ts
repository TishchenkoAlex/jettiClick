import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService } from '../../auth/auth.service';
import { DocService } from '../../common/doc.service';
import { FormControlInfo } from '../dynamic-form/dynamic-form-base';
import { TabsStore } from '../tabcontroller/tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-forms',
  templateUrl: './base.form.component.html'
})
export class BaseFormComponent implements OnInit {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  @Input() id = Math.random().toString();
  @Input() type = this.route.snapshot.params.type as string;
  @Input() form: FormGroup = this.route.snapshot.data.detail;

  docDescription = <string>this.form['metadata'].description;
  get v() { return <FormControlInfo[]>this.form['orderedControls']; }
  get vk() { return <{ [key: string]: FormControlInfo }>this.form['byKeyControls']; }
  get hasTables() { return !!(<FormControlInfo[]>this.form['orderedControls']).find(t => t.type === 'table'); }
  get tables() { return (<FormControlInfo[]>this.form['orderedControls']).filter(t => t.type === 'table'); }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, private auth: AuthService, public tabStore: TabsStore) { }

  ngOnInit() {
    console.log(this.form);
    this.auth.userProfile$.pipe(take(1)).subscribe();
  }

  private _close() {
    this.tabStore.close(this.tabStore.state.tabs[this.tabStore.selectedIndex]);
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

  async Execute(): Promise<any> {
    const user = this.auth.userProfile;
    const data = this.form.value;
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

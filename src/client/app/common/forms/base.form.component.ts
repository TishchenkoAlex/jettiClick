import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, QueryList, ViewChildren } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { DocService } from '../../common/doc.service';
import { FormControlInfo } from '../dynamic-form/dynamic-form-base';
import { TabsStore } from '../tabcontroller/tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-forms',
  templateUrl: './base.form.component.html'
})
export class BaseFormComponent {

  @Input() id = Math.random().toString();
  @Input() type = this.route.snapshot.params.type as string;
  @Input() form: FormGroup = this.route.snapshot.data.detail;
  @ViewChildren(CdkTrapFocus) cdkTrapFocus: QueryList<CdkTrapFocus>;

  get docDescription() { return <string>this.form['metadata'].description; }
  get v() { return <FormControlInfo[]>this.form['orderedControls']; }
  get vk() { return <{ [key: string]: FormControlInfo }>this.form['byKeyControls']; }
  get hasTables() { return !!(<FormControlInfo[]>this.form['orderedControls']).find(t => t.type === 'table'); }
  get tables() { return (<FormControlInfo[]>this.form['orderedControls']).filter(t => t.type === 'table'); }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, private auth: AuthService, public tabStore: TabsStore) { }

  private _close() {
    this.tabStore.close(this.tabStore.state.tabs[this.tabStore.selectedIndex]);
    const returnTab = this.tabStore.state.tabs[this.tabStore.selectedIndex];
    this.router.navigate([returnTab.docType, returnTab.docID]);
  }

  Close() {
    if (this.form.pristine) { this._close(); return; }
    this.ds.confirmationService.confirm({
      header: 'Discard changes and close?',
      message: '',
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      reject: this.focus.bind(this),
      key: this.id
    });
    this.cd.detectChanges();
  }

  focus() {
    this.cdkTrapFocus.find(el => el.autoCapture).focusTrap.focusFirstTabbableElementWhenReady();
  }

  async Execute(): Promise<any> {
    const data = this.form.value;
    return await this.ds.api.jobAdd({
      job: { id: 'post', description: '(Post Invoices' },
      type: data.type.id,
      company: data.company.id,
      StartDate: data.StartDate,
      EndDate: data.EndDate.setHours(23, 59, 59, 999)
    }/* , { jobId: 'FormPostServer', removeOnComplete: true, removeOnFail: true } */).toPromise();
  }

}

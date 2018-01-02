import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../common/doc.service';
import { ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { LoadingService } from './../../common/loading.service';
import { SocketIOService } from './../../services/socket-io.sevice';
import { take, filter } from 'rxjs/operators';
import { environment } from './../../../environments/environment';
import * as socketIOClient from 'socket.io-client';
import { Auth0Service } from './../../auth/auth0.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-forms',
  templateUrl: './base.form.component.html'
})
export class BaseFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  socket: SocketIOClient.Socket;
  viewModel: ViewModel = this.route.data['value'].detail;
  docId = Math.random().toString();

  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _authSubscription$: Subscription = Subscription.EMPTY;

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table') }
  get tables() { return this.viewModel.view.filter(t => t.type === 'table') }

  constructor(public router: Router, public route: ActivatedRoute, public media: ObservableMedia,
    public cd: ChangeDetectorRef, public ds: DocService, private auth: Auth0Service,
    private location: Location, private lds: LoadingService) {
  }

  ngOnInit() {
    this._authSubscription$ = this.auth.userProfile$.subscribe(u => {
      if (u && u.sub) {
        this.socket = socketIOClient(environment.socket, { query: 'user=' + u.sub });
        this.socket.on('Form.Post', data => {})
      }
    });

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.viewModel.model.type && data.id === this.docId))
      .subscribe(data => this.Close())
  }

  ngOnDestroy() {
    this._closeSubscription$.unsubscribe();
    this._authSubscription$.unsubscribe();
    this.socket.disconnect();
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

  async Execute2(mode = 'post') {
    const result = await this.ds.api.call('Form.Post', this.viewModel.formGroup.getRawValue(), 'Execute2', []).toPromise();
    const tasksCount = result.length; let i = tasksCount;
    for (const s of result) {
      this.lds.counter = Math.round(100 - ((--i) / tasksCount * 100));
      try {
        if (mode === 'post') { await this.ds.post(s.id) } else { await this.ds.unpost(s.id) }
      } catch (err) {
        console.log(err.error);
        this.ds.openSnackBar('error', 'Error on execute', err.error)
      }
    }
    this.lds.counter = 0;
  }

  async Execute(mode = 'post') {
    const result = await this.ds.api.call('Form.Post', this.viewModel.formGroup.getRawValue(), 'Execute', [], true).toPromise();
  }


}

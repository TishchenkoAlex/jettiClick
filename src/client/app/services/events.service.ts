import { Injectable, OnDestroy } from '@angular/core';
import { take, throttleTime } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import * as socketIOClient from 'socket.io-client';

import { IJob, IJobs } from '../../../server/models/api';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../services/api.service';
import { environment } from './../../environments/environment';

@Injectable()
export class EventsService implements OnDestroy {

  private _latestTasks = new Subject<IJobs>();
  latestEvents$ = this._latestTasks.asObservable();

  private _debonce = new Subject<IJob>();
  private debonce$ = this._debonce.asObservable();

  private _authSubscription$: Subscription = Subscription.EMPTY;
  private socket: SocketIOClient.Socket;

  constructor(private auth: AuthService, private api: ApiService) {

    this.debonce$.pipe(throttleTime(1000)).subscribe(job => this.update(job));

    this._authSubscription$ = this.auth.userProfile$.subscribe(u => {
      if (u && u.account) {
        this.socket = socketIOClient(environment.host, { query: 'user=' + u.account.email, path: environment.path + '/socket.io' });
        const e = this.socket.on('job', (job: IJob) => this._debonce.next(job));
        this.update();
        console.log('socket.connect', environment.host + environment.path + '/socket.io');
      } else {
        console.log('socket.disconnect');
        if (this.socket) { this.socket.disconnect(); }
      }
    });
  }

  private update(task?: IJob) {
    this.api.jobs().pipe(take(1)).subscribe(jobs => this._latestTasks.next(jobs));
  }

  ngOnDestroy() {
    this._authSubscription$.unsubscribe();
    this._latestTasks.unsubscribe();
    this._debonce.unsubscribe();
    this.socket.disconnect();
  }
}

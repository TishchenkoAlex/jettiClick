import { Injectable, OnDestroy } from '@angular/core';
import { take, throttleTime } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import * as socketIOClient from 'socket.io-client';

import { IJob, IJobs } from '../../../server/models/api';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../services/api.service';
import { environment } from './../../environments/environment';

@Injectable()
export class EventsService implements OnDestroy {

  private _latestJobs$ = new Subject<IJobs>();
  latestJobs$ = this._latestJobs$.asObservable();
  private debonce$ = new Subject<IJob>();
  private socket: SocketIOClient.Socket;

  constructor(private auth: AuthService, private api: ApiService) {

    this.debonce$.pipe(throttleTime(5000)).subscribe(job => this.update(job));

    this.auth.userProfile$.subscribe(u => {
      if (u && u.account) {
        this.socket = socketIOClient(environment.host, {  query: 'token=' + u.token, path: environment.path + '/socket.io'});
        this.socket.on('job', (job: IJob) =>  job.finishedOn ? this.update(job) : this.debonce$.next(job));
        this.update();
      } else {
        if (this.socket) { this.socket.disconnect(); }
      }
    });
  }

  private update(job?: IJob) {
    this.api.jobs().pipe(take(1)).subscribe(jobs => this._latestJobs$.next(jobs));
  }

  ngOnDestroy() {
    this.debonce$.complete();
    this.socket.disconnect();
  }
}

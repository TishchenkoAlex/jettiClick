import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { filter, map, share, take } from 'rxjs/operators';
import * as socketIOClient from 'socket.io-client';
import { IJob, IJobs } from '../../../server/models/api';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../services/api.service';
import { environment } from './../../environments/environment';


@Injectable()
export class EventsService implements OnDestroy {

  private _latestJobs$ = new Subject<IJobs>();
  latestJobs$ = this._latestJobs$.asObservable().pipe(map(j => {
    return [
      ...((j.Active || []).map(el => ({ ...el, status: 'Active' }))),
      ...((j.Completed || []).map(el => ({ ...el, status: 'Completed' }))),
      ...((j.Failed || []).map(el => ({ ...el, status: 'Failed' }))),
      ...((j.Waiting || []).map(el => ({ ...el, status: 'Waiting' })))]
      .sort((a, b) => b.timestamp - a.timestamp);
  }), share());
  latestJobsAll$ = this._latestJobs$.asObservable().pipe(map(j => j.Active.length), share());
  private debonce$ = new Subject<IJob>();
  private socket: SocketIOClient.Socket;

  constructor(private auth: AuthService, private api: ApiService) {

    this.debonce$.subscribe(job => this.update(job));

    this.auth.userProfile$.pipe(filter(u => !!(u && u.account))).subscribe(u => {
      this.socket = socketIOClient(`${environment.socket}`, { query: 'token=' + u.token, transports: ['websocket'], secure: true });
      this.socket.on('job', (job: IJob) => job.finishedOn ? this.update(job) : this.debonce$.next(job));
      this.update();
    });
  }

  private update(job?: IJob) {
    this.api.jobs().pipe(take(1)).subscribe(jobs => this._latestJobs$.next(jobs));
  }

  ngOnDestroy() {
    this.debonce$.complete();
    this.debonce$.unsubscribe();
    this.socket.disconnect();
  }
}

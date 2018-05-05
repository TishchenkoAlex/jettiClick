import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, map, take, sampleTime } from 'rxjs/operators';
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
  }));
  latestJobsAll$ = this._latestJobs$.asObservable().pipe(map(j => j.Active.length));
  private debonce$ = new Subject<IJob>();

  constructor(private auth: AuthService, private api: ApiService) {
    this.debonce$.pipe(sampleTime(1000)).subscribe(job => this.update(job));

    this.auth.userProfile$.pipe(filter(u => !!(u && u.account))).subscribe(u => {
      const wsUrl = `${environment.socket}?token=${u.token}&transport=websocket`;

      const wsAuto = (url: string, onmessage: (data) => void) => {
        const socket = new WebSocket(url);
        socket.onmessage = data => onmessage(data);
        socket.onclose = () => setTimeout(() => wsAuto(url, onmessage), 5000);
      };

      wsAuto(wsUrl, data => { this.debonce$.next(data); });
      this.debonce$.next();
    });
  }

  private update(job?: IJob) {
    this.api.jobs().pipe(take(1)).subscribe(jobs => this._latestJobs$.next(jobs));
  }

  ngOnDestroy() {
    this.debonce$.complete();
    this.debonce$.unsubscribe();
  }
}

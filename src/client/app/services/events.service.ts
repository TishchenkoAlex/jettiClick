import { Injectable, OnDestroy } from '@angular/core';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import * as socketIOClient from 'socket.io-client';

import { IEvent } from '../../../server/models/api';
import { environment } from '../../environments/environment';
import { Auth0Service } from '../auth/auth0.service';
import { ApiService } from '../services/api.service';

@Injectable()
export class EventsService implements OnDestroy {

  private _latestTasks = new Subject<{ active: number, events: IEvent[]}>();
  latestEvents$ = this._latestTasks.asObservable();

  private _authSubscription$: Subscription = Subscription.EMPTY;
  private socket: SocketIOClient.Socket;

  constructor(private auth: Auth0Service, private api: ApiService) {
    this._authSubscription$ = this.auth.userProfile$.subscribe(u => {
      if (u && u.sub) {
        this.socket = socketIOClient(environment.socket, { query: 'user=' + u.sub });
        this.socket.on('event', task => this.update(task));
      }
    });
    this.update();
  }

  private update(task?: IEvent) {
    this.api.latestEvents().pipe(take(1)).subscribe(tasks => this._latestTasks.next(tasks));
  }

  ngOnDestroy() {
    this._authSubscription$.unsubscribe();
    this._latestTasks.unsubscribe();
    this.socket.disconnect();
  }
}

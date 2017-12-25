import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as socketIOClient from 'socket.io-client';

import { environment } from '../../environments/environment';

@Injectable()
export class SocketIOService {
/* 
  socket = socketIOClient.connect(environment.socket)
    .on('event', data => this._do.next(data))
    .on('sql', data => this._sql.next(data));

  protected _do = new Subject<any>();
  event$ = this._do.asObservable();

  protected _sql = new Subject<any>();
  sql$ = this._sql.asObservable();
 */
}

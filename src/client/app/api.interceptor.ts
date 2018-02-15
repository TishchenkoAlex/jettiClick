import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of as observableOf } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { dateReviver } from './../../server/fuctions/dateReviver';
import { AuthService } from './auth/auth.service';
import { LoadingService } from './common/loading.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(private lds: LoadingService, private auth: AuthService, private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${this.auth.token}`}});

    if (req.url.includes('user/settings') || req.url.includes('/jobs')) { // exclude setting requests
      console.log('API', req.url);
      return next.handle(req);
    }
    this.lds.color = 'accent';
    this.lds.loading = true;
    return next.handle(req).pipe(
      map(data => data instanceof HttpResponse ? data.clone({ body: JSON.parse(JSON.stringify(data.body), dateReviver) }) : data),
      tap(data => {
        if (data instanceof HttpResponse) {
          this.lds.loading = false;
          if (isDevMode()) {
            console.log('API', req.url);
          }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth.logout();
          this.lds.loading = false;
          return observableOf();
        }
        this.lds.loading = true;
        this.lds.color = 'warn';
        this.messageService.add({ severity: 'error', summary: err.statusText, detail: err.error, id: Math.random() });
        return ErrorObservable.create(err);
      }));
  }
}

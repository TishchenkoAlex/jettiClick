import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, Injector, isDevMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError, map, tap } from 'rxjs/operators';

import { dateReviverUTC } from './../../server/fuctions/dateReviver';
import { environment } from './../environments/environment';
import { Auth0Service } from './auth/auth0.service';
import { LoadingService } from './common/loading.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private auth: Auth0Service;

  constructor(private lds: LoadingService, private inj: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('user/settings') || req.url.includes('event/latest')) { // exclude setting requests
      return next.handle(req);
    }
    this.lds.color = 'accent';
    this.lds.loading = true;
    return next.handle(req).pipe(
      map(data => data instanceof HttpResponse ? data.clone({ body: JSON.parse(JSON.stringify(data.body), dateReviverUTC) }) : data),
      tap(data => {
        if (data instanceof HttpResponse) {
          this.lds.loading = false
          if (isDevMode) { console.log('API', req.url.replace(environment.api, '')) }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth = this.inj.get(Auth0Service);
          this.auth.logout();
          return Observable.of();
        }
        this.lds.loading = true;
        this.lds.color = 'warn';
        return ErrorObservable.create(err);
      }));
  }
}

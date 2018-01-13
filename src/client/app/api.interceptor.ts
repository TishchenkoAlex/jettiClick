import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, Injector, isDevMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of as observableOf } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { dateReviver } from './../../server/fuctions/dateReviver';
import { environment } from './../environments/environment';
import { AuthService } from './auth/auth.service';
import { LoadingService } from './common/loading.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private auth: AuthService;

  constructor(private lds: LoadingService, private inj: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.auth = this.inj.get(AuthService);
    req = req.clone({ setHeaders: { Authorization: `Bearer ${this.auth.token}`}});

    if (req.url.includes('user/settings') || req.url.includes('/jobs')) { // exclude setting requests
      return next.handle(req);
    }
    this.lds.color = 'accent';
    this.lds.loading = true;
    return next.handle(req).pipe(
      map(data => data instanceof HttpResponse ? data.clone({ body: JSON.parse(JSON.stringify(data.body), dateReviver) }) : data),
      tap(data => {
        if (data instanceof HttpResponse) {
          this.lds.loading = false;
          console.log('API', req.url);
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
        return ErrorObservable.create(err);
      }));
  }
}

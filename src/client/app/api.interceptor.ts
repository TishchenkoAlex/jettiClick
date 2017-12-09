import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError, take, tap } from 'rxjs/operators';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { environment } from './../environments/environment';

import { LoadingService } from './common/loading.service';
import { dateReviver } from './common/utils';

export class ApiInterceptor implements HttpInterceptor {
  constructor(private lds: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('user/settings')) { // exclude setting requests
      return next.handle(req);
    }
    this.lds.color = 'accent';
    this.lds.loading = true;
    return next.handle(req).pipe(
      tap(data => {
        if (data.type !== 0) {
          this.lds.loading = false;
          data['body'] = JSON.parse(JSON.stringify(data['body']), dateReviver)
          if (isDevMode) { console.log('API', req.url.replace(environment.api, '')) }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        this.lds.loading = true;
        this.lds.color = 'warn';
        return ErrorObservable.create(err);
      }));
  }
}

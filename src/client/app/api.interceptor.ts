import { tap } from 'rxjs/operators';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { environment } from './../environments/environment';

import { LoadingService } from './common/loading.service';

export class ApiInterceptor implements HttpInterceptor {
  constructor(private ls: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.ls.loading = true;
    return next.handle(req).pipe(
      tap(data => {
        if (data.type !== 0) {
          if (isDevMode) { console.log('API', req.url.replace(environment.api, '')) }
          this.ls.loading = false;
        }
      }));
  }
}

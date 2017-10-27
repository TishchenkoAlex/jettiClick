import { LoadingService } from './common/loading.service';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

export class ApiInterceptor implements HttpInterceptor {
  constructor(private ls: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.ls.loading = true;
    return next.handle(req)
      .do(data => {
        if (data.type !== 0) {
          console.log('API', req.url);
          this.ls.loading = false;
        }
      });
  }
}

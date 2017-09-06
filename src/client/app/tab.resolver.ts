import { ApiService } from './services/api.service';
import { Injectable } from '@angular/core';
import { DynamicFormService, ViewModel } from './common/dynamic-form/dynamic-form.service';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class TabResolver implements Resolve<any> {

    constructor(private dfs: DynamicFormService, private api: ApiService) { }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ViewModel> | Observable<any[]> {
        if (route.params['type'] === 'Home') {
            return Observable.of([]);
        } else {
            if (route.params['id']) {
                return this.dfs.getViewModel(route.params['type'], route.params['id'])
            } else {
                return this.api.getView(route.params['type'])
            }
        }
    }
}

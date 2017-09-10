import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';
import { Injectable } from '@angular/core';
import { DynamicFormService, ViewModel } from './common/dynamic-form/dynamic-form.service';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class TabResolver implements Resolve<any> {

  constructor(private dfs: DynamicFormService, private api: ApiService, public tc: TabControllerService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ViewModel> | Observable<any[]> {
    if (route.params['type'] === 'Home') { return Observable.of([]); }
    if (this.tc.tabs.findIndex(i =>
      (i.docType === route.params['type']) &&
      (i.docID === (route.params['id'] || ''))) === -1) {
      if (route.params['id']) {
        return this.dfs.getViewModel(route.params['type'], route.params['id'])
      }
      return this.api.getView(route.params['type'])
    }
  }
}

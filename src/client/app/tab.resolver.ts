import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { DynamicFormService, ViewModel } from './common/dynamic-form/dynamic-form.service';
import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';
import { SideNavService } from './services/side-nav.service';

@Injectable()
export class TabResolver implements Resolve<any> {

  constructor(private dfs: DynamicFormService, private api: ApiService,
    public tc: TabControllerService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ViewModel> | Observable<any[]> {
    const type: string = route.params['type'];
    const id: string = route.params['id'] || '';
    if (type === 'Home') { return Observable.of(null); }
    if (this.tc.tabs.findIndex(i => i.docType === type && i.docID === id) === -1) {
    if (route.params['id']) {
        return this.dfs.getViewModel(route.params['type'], route.params['id'])
      }
      return this.api.getView(route.params['type'])
    }
  }
}

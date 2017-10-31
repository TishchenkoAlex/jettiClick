import { SideNavService } from './services/side-nav.service';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { DynamicFormService, ViewModel } from './common/dynamic-form/dynamic-form.service';
import { HOME, TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';
import { first, takeLast, take } from 'rxjs/operators';

@Injectable()
export class TabResolver implements Resolve<any> {

  constructor(private dfs: DynamicFormService, public tcs: TabControllerService, private sns: SideNavService, private api: ApiService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const type: string = route.params['type'];
    const id: string = route.params['id'] || '';
    this.sns.do({id: id, type: type});
    if (type === HOME) { return null }
    if (this.tcs.tabs.findIndex(i => i.docType === type && i.docID === id) === -1) {
      if (route.params['id']) {
        return this.dfs.getViewModel$(route.params['type'], route.params['id']);
      }
      return Observable.forkJoin(
        this.dfs.getView$(route.params['type']),
        this.api.getUserFormListSettings(route.params['type'])
      );
    }
  }
}

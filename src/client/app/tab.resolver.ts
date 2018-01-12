import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { DynamicFormService } from './common/dynamic-form/dynamic-form.service';
import { HOME, TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';


@Injectable()
export class TabResolver implements Resolve<any> {

  constructor(private dfs: DynamicFormService, public tcs: TabControllerService, private api: ApiService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const type: string = route.params['type'];
    const id: string = route.params['id'] || '';
    // this.sns.do({id: id, type: type});
    if (type === HOME) { return null; }
    if (type.startsWith('Form.')) {
      return this.dfs.getFormView$(route.params['type']);
    }
    if (this.tcs.tabs.findIndex(i => i.docType === type && i.docID === id) === -1) {
      if (route.params['id']) {
        return this.dfs.getViewModel$(route.params['type'], route.params['id']);
      }
      return forkJoin(
        this.api.getView(route.params['type']),
        this.api.getUserFormListSettings(route.params['type'])
      );
    }
  }
}

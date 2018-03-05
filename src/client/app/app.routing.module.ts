import { Injectable, NgModule } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  Resolve,
  RouteReuseStrategy,
  RouterModule,
  RouterStateSnapshot,
  Routes,
} from '@angular/router';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { AuthGuardService } from './auth/auth.guard.service';
import { DynamicFormService } from './common/dynamic-form/dynamic-form.service';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';
import { TabsStore } from './common/tabcontroller/tabs.store';
import { ApiService } from './services/api.service';

export class AppRouteReuseStrategy extends RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot): boolean { return false; }
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void { }
  shouldAttach(route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle { return null; }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean { return future.component === curr.component; }
}

@Injectable()
export class TabResolver implements Resolve<any> {
  constructor(private dfs: DynamicFormService, private api: ApiService, private tabStore: TabsStore) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const id: string = route.params.id || '';
    const type = route.params.type;
    if (type === 'home') { return null; }
    if (type.startsWith('Form.')) { return this.dfs.getFormView$(type); }
    if (this.tabStore.state.tabs.findIndex(i => i.routerLink === state.url) === -1) {
      return id ?
        this.dfs.getViewModel$(route.params['type'], id, route.queryParams) :
        forkJoin(this.api.getView(type), this.api.getUserFormListSettings(type));
    }
  }
}


// tslint:disable:max-line-length
export const routes: Routes = [
  { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver }, canActivate: [AuthGuardService] },
  { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver }, canActivate: [AuthGuardService] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
    AuthGuardService,
    TabResolver,
  ]
})
export class RoutingModule { }

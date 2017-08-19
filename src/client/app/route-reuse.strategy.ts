import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';

export class AppRouteReuseStrategy extends RouteReuseStrategy {
    shouldDetach(route: ActivatedRouteSnapshot): boolean { return false; }
    store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void { }
    shouldAttach(route: ActivatedRouteSnapshot): boolean { return false; }
    // tslint:disable-next-line:no-non-null-assertion
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle { return null; }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // return future.routeConfig === curr.routeConfig;
        return true;
    }
}

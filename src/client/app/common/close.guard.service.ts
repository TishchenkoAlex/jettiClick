import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CanDeactivate } from '@angular/router/src/interfaces';
import { Observable } from 'rxjs/Observable';

import { TabControllerComponent } from './../common/tabcontroller/tabcontroller.component';

@Injectable()
export class CloseGuardService implements CanDeactivate<TabControllerComponent> {

  canDeactivate(component: TabControllerComponent, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {

    return true;
  }

}

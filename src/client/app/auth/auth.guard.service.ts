import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';
import { RoleObject, RoleType } from './../../../server/models/Roles/base';

import { HOME } from './../common/tabcontroller/tabcontroller.service';
import { Auth0Service } from './auth0.service';

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(private auth: Auth0Service) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    const check = (roles: RoleType[], objects: RoleObject[]) =>
      route.params['type'] === HOME ||
      roles.findIndex(r => r === 'Admin') >= 0 ||
      objects.findIndex(el => el.type === route.params['type']) >= 0;

    if (this.auth.userRoles.length) { return check(this.auth.userRoles, this.auth.userRoleObjects) }

    return this.auth.api.getUserRoles().pipe(
      take(1),
      map(data => check(data.roles, data.Objects))
    );
  }
}

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import { RoleObject, RoleType } from '../../../server/models/Roles/Base';
import { AuthService } from '../auth/auth.service';
import { HOME } from './../common/tabcontroller/tabcontroller.service';
import { ApiService } from './../services/api.service';

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(private auth: AuthService, private api: ApiService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (route.params['type'] === HOME) { return true; }

    const check = (roles: RoleType[], objects: RoleObject[]) =>
      roles.findIndex(r => r === 'Admin') >= 0 ||
      objects.findIndex(el => el.type === route.params['type']) >= 0;

    if (this.auth.userRoles.length) { return check(this.auth.userRoles, this.auth.userRoleObjects); }

    return this.api.getUserRoles().toPromise()
      .then(data => check(data.roles, data.Objects))
      .catch(err => false);
  }
}

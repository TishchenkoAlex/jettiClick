import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { Auth0Service } from './auth0.service';

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(private auth: Auth0Service, private router: Router) { }

  canActivate(): boolean {
/*     if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/Home']);
      return false;
    } */
    return true;
  }

}

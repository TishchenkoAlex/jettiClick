import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as auth0 from 'auth0-js';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { take } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { RoleObject, RoleType } from './../../../server/models/Roles/base';
import { ApiService } from './../services/api.service';

@Injectable()
export class Auth0Service {

  userProfile$ = new BehaviorSubject<any>(null);
  userRoles: RoleType[] = [];
  userRoleObjects: RoleObject[] = [];

  get isAdmin() { return this.userRoles.findIndex(r => r === 'Admin') >= 0 };

  auth0 = new auth0.WebAuth(environment.auth0);

  constructor(public router: Router, public api: ApiService) { }

  public login(): void {
    this.auth0.authorize();
  }

  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        this.setSession(authResult);
      } else if (err) {
        this.router.navigate(['Home']);
      }
      this.getProfile();
    });
  }

  private setSession(authResult): void {
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }

  public logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    this.userProfile$.next(null);
    this.router.navigate(['Home']);
  }

  public isAuthenticated(): boolean {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public getProfile(): void {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.auth0.client.userInfo(accessToken, (err, profile) => {
        if (profile) {
          this.userProfile$.next(profile);
          this.api.getUserRoles().pipe(take(1)).subscribe(data => {
            this.userRoleObjects = data.Objects;
            this.userRoles = data.roles;
          });
        }
      });
    }
  }
}

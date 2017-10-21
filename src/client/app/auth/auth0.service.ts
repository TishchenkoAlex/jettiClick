import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/filter';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as auth0 from 'auth0-js';

import { environment } from '../../environments/environment';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class Auth0Service {

  protected _userProfile$ = new Subject<any>();
  userProfile$ = this._userProfile$.asObservable();

  auth0 = new auth0.WebAuth(environment.auth0);

  constructor(public router: Router) { }

  public login(): void {
    this.auth0.authorize();
  }

  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        this.setSession(authResult);
      } else if (err) {
        this.router.navigate(['/Home']);
      }
      this.getProfile();
    });
  }

  private setSession(authResult): void {
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }

  public logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    this._userProfile$.next(null);
    this.router.navigate(['/Home']);
  }

  public isAuthenticated(): boolean {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public getProfile(): void {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.auth0.client.userInfo(accessToken, (err, profile) => {
        if (profile) { this._userProfile$.next(profile) }
      });
    }
  }
}

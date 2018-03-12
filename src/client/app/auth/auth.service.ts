import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as jwt_decode from 'jwt-decode';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter, map, tap } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators/shareReplay';

import { IAccount, ILoginResponse } from '../../../server/models/api';
import { getRoleObjects, RoleObject, RoleType } from '../../../server/models/Roles/Base';
import { environment } from '../../environments/environment';

export const ANONYMOUS_USER: ILoginResponse = { account: undefined, token: undefined };

@Injectable()
export class AuthService {

  private readonly _userProfile$ = new BehaviorSubject<ILoginResponse>(undefined);
  userProfile$ = this._userProfile$.asObservable().pipe(filter(u => !!u));
  isLoggedIn$ = this.userProfile$.pipe(map(p => p.account !== undefined));
  isLoggedOut$ = this.isLoggedIn$.pipe(map(isLoggedIn => !isLoggedIn));
  isAdmin$ = this._userProfile$.asObservable().pipe(
    filter(u => u.account.roles.findIndex(r => r === 'Admin') >= 0), map(u => true));
  url$ = this.userProfile$.pipe(map(u => this.sanitizer.bypassSecurityTrustResourceUrl(u.account.env.reportsUrl)));

  userRoles: RoleType[] = [];
  userRoleObjects: RoleObject[] = [];
  get userProfile() { return this._userProfile$.value; }

  get token() { return localStorage.getItem('jetti_token'); }
  set token(value) { localStorage.setItem('jetti_token', value); }
  get tokenPayload() { return jwt_decode(this.token); }

  constructor(private router: Router, private http: HttpClient, public sanitizer: DomSanitizer) {
    if (this.token) { this.setEnv(); }
  }

  public login(email: string, password: string) {
    return this.http.post<ILoginResponse>(`${environment.auth}login`, { email, password }).pipe(
      tap(loginResponse => { if (loginResponse.account) { this.init(loginResponse); } }),
      shareReplay());
  }

  public logout() {
    localStorage.removeItem('jetti_token');
    this._userProfile$.next({...ANONYMOUS_USER});
    return this.router.navigate(['/home'], {queryParams: {}});
  }

  public getAccount() {
    return this.http.get<IAccount>(`${environment.auth}account`).pipe(
      tap(account => {
        const LoginResponse: ILoginResponse = { account, token: this.token };
        this.init(LoginResponse);
      }));
  }

  private setEnv() {
    const tokenPayload = this.tokenPayload;
    const env = tokenPayload ? tokenPayload['env'] : null;
    if (!isDevMode() && env) {
      environment.api = env.host + env.path + '/api/';
      environment.host = env.host;
      environment.path = env.path;
      environment.auth = env.host + env.path + '/auth/';
    }
  }

  private init(loginResponse: ILoginResponse) {
    this.token = loginResponse.token;
    this.setEnv();
    this.userRoles = loginResponse.account.roles as RoleType[];
    this.userRoleObjects = getRoleObjects(this.userRoles);
    this._userProfile$.next(loginResponse);
  }

}

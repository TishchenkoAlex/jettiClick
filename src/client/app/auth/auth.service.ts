import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import * as jwt_decode from 'jwt-decode';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { tap } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators/shareReplay';

import { IAccount, ILoginResponse } from '../../../server/models/api';
import { getRoleObjects, RoleObject, RoleType } from '../../../server/models/Roles/Base';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
  private url = environment.auth;

  userProfile$ = new BehaviorSubject<ILoginResponse>(null);
  userRoles: RoleType[] = [];
  userRoleObjects: RoleObject[] = [];

  get token() { return localStorage.getItem('jetti_token'); }
  set token(value) { localStorage.setItem('jetti_token', value); }
  get isAdmin() { return this.userRoles.findIndex(r => r === 'Admin') >= 0; }
  isAuthenticated = () => this.userProfile$.value ? true : false;
  get tokenPayload() { return jwt_decode(this.token); }

  constructor(private router: Router, private http: HttpClient) { }

  public login(email: string, password: string) {
    return this.http.post<ILoginResponse>(`${this.url}login`, { email, password }).pipe(
      tap(loginResponse => { if (loginResponse.account) { this.init(loginResponse); } }),
      shareReplay());
  }

  private init(loginResponse: ILoginResponse) {
    this.userRoles = loginResponse.account.roles as RoleType[];
    this.userRoleObjects = getRoleObjects(this.userRoles);
    this.token = loginResponse.token;
    const tokenPayload = this.tokenPayload;
    const env = tokenPayload ? tokenPayload['env'] : null;
    if (!isDevMode() && env) {
      environment.api = env.url + '/api/';
      environment.socket = env.url + '/';
      environment.auth = env.url + '/auth/';
    }
    this.userProfile$.next(loginResponse);
  }

  public logout() {
    localStorage.removeItem('jetti_token');
    this.userProfile$.next(null);
    return this.router.navigate(['Home']);
  }

  public getAccount() {
    return this.http.get<IAccount>(`${this.url}account`).pipe(
      tap(account => {
        const LoginResponse: ILoginResponse = { account, token: this.token };
        this.init(LoginResponse);
      }));
  }

}

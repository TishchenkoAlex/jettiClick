import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { tap } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators/shareReplay';
import * as jwtdecode from 'jwt-decode';
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
  get tokenPayload() { return jwtdecode(this.token); }

  constructor(private router: Router, private http: HttpClient) {
    this.userProfile$.subscribe(loginResponse => {
      if (loginResponse && loginResponse.account) {
        this.userRoles = loginResponse.account.roles as RoleType[];
        this.userRoleObjects = getRoleObjects(this.userRoles);
        this.token = loginResponse.token;
        if (!isDevMode()) {
          environment.api = this.tokenPayload['env'].url + '/api/';
          environment.socket = this.tokenPayload['env'].url + '/';
          environment.auth = this.tokenPayload['env'].url + '/auth/';
        }
        console.log('tokenDecode', this.tokenPayload, environment.api);
      }
    });
  }

  public login(email: string, password: string) {
    return this.http.post<ILoginResponse>(`${this.url}login`, { email, password }).pipe(
      shareReplay(),
      tap(loginResponse => this.userProfile$.next(loginResponse)));
  }

  public logout() {
    localStorage.removeItem('jetti_token');
    this.userProfile$.next(null);
    return this.router.navigate(['Home']);
  }

  public getAccount() {
    return this.http.get<IAccount>(`${this.url}account`).pipe(
      tap(account => this.userProfile$.next({ account, token: this.token })));
  }

}

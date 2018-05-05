import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as jwt_decode from 'jwt-decode';
import { filter, map, tap, shareReplay } from 'rxjs/operators';
import { RoleObject, RoleType, getRoleObjects } from '../../../server/models/Roles/Base';
import { IAccount, ILoginResponse } from '../../../server/models/api';
import { environment } /*  */ from '../../environments/environment';
// tslint:disable-next-line:import-blacklist
import { BehaviorSubject } from 'rxjs';

export const ANONYMOUS_USER: ILoginResponse = { account: undefined, token: '' };

@Injectable()
export class AuthService {

  private readonly _userProfile$ = new BehaviorSubject<ILoginResponse | undefined>(undefined);
  userProfile$ = this._userProfile$.asObservable().pipe(filter((u: ILoginResponse) => !!u));
  isLoggedIn$ = this.userProfile$.pipe(map(p => p.account !== undefined));
  isLoggedOut$ = this.isLoggedIn$.pipe(map(isLoggedIn => !isLoggedIn));
  isAdmin$ = this.userProfile$.pipe(filter(u => u.account!.roles.findIndex(r => r === 'Admin') >= 0), map(u => true));

  url$ = this.userProfile$.pipe(
    map(u => u.account && u.account.env && u.account.env.reportsUrl || ''),
    filter(u => !!u),
    map(u => this.sanitizer.bypassSecurityTrustResourceUrl(u)));

  userRoles: RoleType[] = [];
  userRoleObjects: RoleObject[] = [];
  get userProfile() { return this._userProfile$.value; }

  get token() { return localStorage.getItem('jetti_token') || ''; }
  set token(value) { localStorage.setItem('jetti_token', value); }
  get tokenPayload() { return jwt_decode(this.token); }

  constructor(private router: Router, private http: HttpClient, public sanitizer: DomSanitizer) {}

  public login(email: string, password: string) {
    return this.http.post<ILoginResponse>(`${environment.auth}login`, { email, password }).pipe(
      tap(loginResponse => { if (loginResponse.account) { this.init(loginResponse); } }),
      shareReplay());
  }

  public logout() {
    localStorage.removeItem('jetti_token');
    this._userProfile$.next({ ...ANONYMOUS_USER });
    return this.router.navigate([''], { queryParams: {} });
  }

  public getAccount() {
    return this.http.get<IAccount>(`${environment.auth}account`).pipe(
      tap(account => {
        const LoginResponse: ILoginResponse = { account, token: this.token };
        this.init(LoginResponse);
      }));
  }

  private init(loginResponse: ILoginResponse) {
    if (loginResponse.token && loginResponse.account) {
      this.token = loginResponse.token;
      this.userRoles = loginResponse.account.roles as RoleType[];
      this.userRoleObjects = getRoleObjects(this.userRoles);
      this._userProfile$.next(loginResponse);
    }
  }

}

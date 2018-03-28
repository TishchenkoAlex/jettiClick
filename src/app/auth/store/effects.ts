import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs/observable/of';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { AuthActionTypes, Login, LoginFailure, LoginSuccess } from './actions';

@Injectable()
export class AuthEffects {
  @Effect()
  login$ = this.actions$.pipe(
    ofType<Login>(AuthActionTypes.Login),
    map(action => action.payload),
    exhaustMap(auth =>
      this.authService.login(auth.email, auth.password).pipe(
        map(account => new LoginSuccess({
          accout: ({
            created: account!.account!.created,
            description: account!.account!.description,
            email: account!.account!.email,
            env: account!.account!.env,
            isAdmin: account!.account!.isAdmin,
            roles: account!.account!.roles,
            status: account!.account!.status,
            token: account!.token || ''
          })
        })),
        catchError(error => of(new LoginFailure(error)))
      )
    )
  );

  @Effect({ dispatch: false })
  loginSuccess$ = this.actions$.pipe(
    ofType(AuthActionTypes.LoginSuccess),
    // tap(() => this.router.navigate(['/home']))
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) { }
}

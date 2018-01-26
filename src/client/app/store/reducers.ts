import { Action } from '@ngrx/store';

import * as fromAuth from '../auth/store/reducer';
import { ActionReducerMap } from '@ngrx/store/src/models';
import { createFeatureSelector, createSelector } from '@ngrx/store';

export interface State {
  auth: fromAuth.State;
}

export const reducers: ActionReducerMap<State> = {
  auth: fromAuth.reducer
};

export const getAuthState = createFeatureSelector<fromAuth.State>('auth');
export const getLoggedIn = createSelector(getAuthState, fromAuth.getLoggedIn);
export const getAccount = createSelector(getAuthState, fromAuth.getAccount);

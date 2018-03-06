import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ActionReducerMap } from '@ngrx/store/src/models';

import * as fromAuth from '../auth/store/reducers';
import * as fromUI from '../UI/store/reducers';

export interface State {
  auth: fromAuth.State;
  ui: fromUI.State;
}

export const reducers: ActionReducerMap<State> = {
  auth: fromAuth.reducer,
  ui: fromUI.reducer
};

// Auth
export const getAuthState = createFeatureSelector<fromAuth.State>('auth');
export const getLoggedIn = createSelector(getAuthState, fromAuth.getLoggedIn);
export const getAccount = createSelector(getAuthState, fromAuth.getAccount);

// UI
export const getUIState = createFeatureSelector<fromUI.State>('ui');
export const getIsLoading = createSelector(getUIState, fromUI.getIsLoading);
export const getProgress = createSelector(getUIState, fromUI. progress);
export const getColor = createSelector(getUIState, fromUI.color);

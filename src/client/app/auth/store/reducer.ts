import { Account } from './models';
import { AuthActions, AuthActionTypes } from './actions';

export interface State {
  loggedIn: boolean;
  account: Account | null;
}

export const initialState: State = {
  loggedIn: false,
  account: null,
};

export function reducer(state = initialState, action: AuthActions): State {
  switch (action.type) {
    case AuthActionTypes.LoginSuccess: {
      return {
        ...state,
        loggedIn: true,
        account: action.payload.accout,
      };
    }

    case AuthActionTypes.Logout: {
      return initialState;
    }

    default: {
      return state;
    }
  }
}

export const getLoggedIn = (state: State) => state.loggedIn;
export const getAccount = (state: State) => state.account;

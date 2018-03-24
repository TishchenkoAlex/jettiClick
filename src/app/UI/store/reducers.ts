import { UIActions, UIActionTypes } from './actions';

export interface State {
  isLoading: boolean;
  progress: number;
  color: 'primary' | 'accent';
}

const initialState: State = {
  isLoading: false,
  progress: 0,
  color: 'primary',
};

export function reducer(state = initialState, action: UIActions): State {
  switch (action.type) {
    case UIActionTypes.StartLoading: {
      return {
        ...state,
        isLoading: true,
      };
    }

    case UIActionTypes.StopLoading: {
      return {
        ...state,
        isLoading: false,
      };
    }

    case UIActionTypes.SetProgress: {
      return {
        ...state,
        progress: action.payload.progress
      };
    }

    case UIActionTypes.SetColor: {
      return {
        ...state,
         color: action.payload.color
      };
    }

    default: {
      return state;
    }
  }
}

export const getIsLoading = (state: State) => state.isLoading;
export const progress = (state: State) => state.progress;
export const color = (state: State) => state.color;

import { Action } from '@ngrx/store';

export enum UIActionTypes {
  StartLoading = '[UI] Start loading',
  StopLoading = '[UI] Stop loading',
  SetProgress = '[UI] set progress',
  SetColor = '[UI] set color',
}

export class StartLoading implements Action {
  readonly type = UIActionTypes.StartLoading;
}

export class StopLoading implements Action {
  readonly type = UIActionTypes.StopLoading;
}

export class SetProgress implements Action {
  readonly type = UIActionTypes.SetProgress;

  constructor(public payload: { progress: number }) { }
}

export class SetColor implements Action {
  readonly type = UIActionTypes.SetColor;

  constructor(public payload: { color: 'primary' | 'accent' }) { }
}


export type UIActions =
  | StartLoading
  | StopLoading
  | SetProgress
  | SetColor
  ;

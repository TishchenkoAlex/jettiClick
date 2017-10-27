import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { FormListSettings, UserSettings } from '../../../../server/models/user.settings';
import { ApiService } from '../../services/api.service';

interface FormListSettingsAction { type: string, payload: FormListSettings };

@Injectable()
export class UserSettingsService {

  userSettings$ = new BehaviorSubject<UserSettings>({ formListSettings: {}, defaults: {} });
  formListSettings$ = new BehaviorSubject<FormListSettingsAction>({ type: '', payload: { filter: [], order: [] } });

  constructor(private api: ApiService) {}

  get(type: string) {
    if (this.userSettings$.value.formListSettings[type]) {
      this.userSettings$.next(this.userSettings$.value);
      this.formListSettings$.next({ type: type, payload: this.userSettings$.value.formListSettings[type]});
    } else {
      this.api.getUserSettings(type).take(1).subscribe(s => {
        this.userSettings$.value.formListSettings[type] = s || new FormListSettings();
        this.userSettings$.next(this.userSettings$.value);
        this.formListSettings$.next({ type: type, payload: s });
      })
    }
  }

  set(type: string, value: FormListSettings) {
    this.api.setUserSettings(type, value).take(1).filter(s => s === true).subscribe(s => {
      this.userSettings$.next(this.userSettings$.value);
      this.formListSettings$.next({ type: type, payload: value });
    });
  }

}

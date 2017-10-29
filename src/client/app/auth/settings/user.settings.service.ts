import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { FormListSettings, UserDefaultsSettings, UserSettings } from '../../../../server/models/user.settings';
import { ApiService } from '../../services/api.service';

export interface FormListSettingsAction { type: string, payload: FormListSettings };

@Injectable()
export class UserSettingsService {

  userSettings = new UserSettings();
  userDefaultsSettings$ = new Subject<UserDefaultsSettings>();
  formListSettings$ = new Subject<FormListSettingsAction>();

  constructor(private api: ApiService) {}

  selectUserDefaultsSettings() {
    if (this.userSettings.defaults) {
      this.userDefaultsSettings$.next(this.userSettings.defaults);
    }
    this.api.getUserDefaultsSettings()
      .take(1)
      .subscribe(data => {
        this.userSettings.defaults = data;
        this.userDefaultsSettings$.next(data);
      })
  }

  setUserDefaultsSettings(value: UserDefaultsSettings) {
    this.api.setUserDefaultsSettings(value)
      .take(1)
      .filter(s => s === true)
      .subscribe(s => {
        this.userSettings.defaults = value;
        this.userDefaultsSettings$.next(value)
      });
  }

  selectFormListSettings(type: string) {
    if (this.userSettings.formListSettings[type]) {
      this.formListSettings$.next({ type: type, payload: this.userSettings.formListSettings[type] });
    } else {
      this.api.getUserFormListSettings(type)
        .take(1)
        .subscribe(s => {
          this.userSettings.formListSettings[type] = s || new FormListSettings();
          this.formListSettings$.next({ type: type, payload: s });
        })
    }
  }

  setFormListSettings(type: string, value: FormListSettings) {
    console.log(value);
    this.api.setUserFormListSettings(type, value)
      .take(1)
      .filter(s => s === true)
      .subscribe(s => {
        this.userSettings.formListSettings[type] = value;
        this.formListSettings$.next({ type: type, payload: value });
      });
  }

}

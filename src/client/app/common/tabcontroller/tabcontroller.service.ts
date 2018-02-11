import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators/take';

import { AuthService } from '../../auth/auth.service';
import { BaseDynamicCompoment } from '../../common/dynamic-component/dynamic-component';
import { HomeComponent } from '../../home/home.component';
import { getDocListComponent, getDocObjectComponent, getFormComponent } from '../../UI/userForms';
import { MenuItem, SubSystemsMenu } from './../../../../server/models/SubSystems/SubSystems';

export interface TabDef {
  header: string; icon: string; description: string; docType: string; docID: string;
  params: { [key: string]: any }; component: BaseDynamicCompoment;
}

export const HOME = 'Home';

@Injectable()
export class TabControllerService {

  index = 0;
  tabid = HOME;
  docID = '';
  params: { [key: string]: any };
  HOME = HOME;
  homeComponent = new BaseDynamicCompoment(HomeComponent);
  menuItems: MenuItem[] = [];

  homeTab: TabDef =
    { header: HOME, docType: HOME, icon: 'fa fa-home', docID: '', description: '', params: {}, component: this.homeComponent };
  tabs: TabDef[] = [this.homeTab];

  constructor(private auth: AuthService) {
    this.auth.userProfile$.subscribe(() =>
      SubSystemsMenu(this.auth.userRoleObjects).forEach(el => this.menuItems.push(...el.items)));
  }

  GetComponent(docType: string, docID: string) {
    if (docType === HOME) { return this.homeComponent; }
    if (docType.startsWith('Form.')) {
      return new BaseDynamicCompoment(getFormComponent(docType));
    } else {
      if (!docID) {
        return new BaseDynamicCompoment(getDocListComponent(docType));
      } else {
        return new BaseDynamicCompoment(getDocObjectComponent(docType));
      }
    }
  }
}

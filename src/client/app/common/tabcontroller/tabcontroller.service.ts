import { Injectable } from '@angular/core';

import { MenuItem } from '../../../../server/models/api';
import { BaseDynamicCompoment } from '../../common/dynamic-component/dynamic-component';
import { HomeComponent } from '../../home/home.component';
import { getDocListComponent, getDocObjectComponent } from '../../UI/userForms';

export interface TabDef { header: string, icon: string, description: string, docType: string, docID: string, params: {[key: string]: any}}

export const HOME = 'Home';
export const homeTab: TabDef = { header: HOME, docType: HOME, icon: 'home', docID: '', description: '', params: {} };

@Injectable()
export class TabControllerService {

  index = 0;
  tabs: TabDef[] = [];
  tabid: string;
  docID: string;
  params: {[key: string]: any};
  HOME = HOME;
  component: BaseDynamicCompoment;
  menuItems: MenuItem[] = [];

  constructor() {
  }

  GetComponent(tab: TabDef) {
    if (tab.docType === HOME) { return new BaseDynamicCompoment(HomeComponent); }
    if (!tab.docID) {
      return new BaseDynamicCompoment(getDocListComponent(tab.docType));
    } else {
      return new BaseDynamicCompoment(getDocObjectComponent(tab.docType));
    }
  }

}

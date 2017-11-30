import { Injectable } from '@angular/core';

import { MenuItem } from '../../../../server/models/api';
import { BaseDynamicCompoment } from '../../common/dynamic-component/dynamic-component';
import { HomeComponent } from '../../home/home.component';
import { getDocListComponent, getDocObjectComponent } from '../../UI/userForms';

export interface TabDef { header: string, icon: string, description: string, docType: string, docID: string,
    params: {[key: string]: any}, component: BaseDynamicCompoment}

export const HOME = 'Home';

@Injectable()
export class TabControllerService {

  index = 0;
  tabid = HOME;
  docID = '';
  params: {[key: string]: any};
  HOME = HOME;
  component: BaseDynamicCompoment;
  homeComponent = new BaseDynamicCompoment(HomeComponent);
  menuItems: MenuItem[] = [];
  homeTab: TabDef = { header: HOME, docType: HOME, icon: 'home', docID: '', description: '', params: {}, component: this.homeComponent};
  tabs: TabDef[] = [this.homeTab];

  GetComponent(docType, docID) {
    if (docType === HOME) { return this.homeComponent; }
    if (!docID) {
      return new BaseDynamicCompoment(getDocListComponent(docType));
    } else {
      return new BaseDynamicCompoment(getDocObjectComponent(docType));
    }
  }
}

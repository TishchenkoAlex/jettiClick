import { Injectable } from '@angular/core';

import { BaseDynamicCompoment } from '../../common/dynamic-component/dynamic-component';
import { HomeComponent } from '../../home/home.component';
import { getDocListComponent, getDocObjectComponent } from '../../UI/userForms';
import { MenuItem, SubSystemsMenu } from './../../../../server/models/SubSystems/SubSystems';


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
  homeComponent = new BaseDynamicCompoment(HomeComponent);
  menuItems: MenuItem[] = [];

  homeTab: TabDef =
    { header: HOME, docType: HOME, icon: 'fa fa-home', docID: '', description: '', params: {}, component: this.homeComponent};
  tabs: TabDef[] = [this.homeTab];

  constructor() {
    SubSystemsMenu().forEach(el => this.menuItems.push(...el.items));
  }

  GetComponent(docType, docID) {
    if (docType === HOME) { return this.homeComponent; }
    if (!docID) {
      return new BaseDynamicCompoment(getDocListComponent(docType));
    } else {
      return new BaseDynamicCompoment(getDocObjectComponent(docType));
    }
  }
}

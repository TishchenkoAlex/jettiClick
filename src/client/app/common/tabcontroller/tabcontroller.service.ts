import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';

import { BaseDynamicCompoment } from '../../common/dynamic-component/dynamic-component';
import { HomeComponent } from '../../home/home.component';
import { getDocListComponent, getDocObjectComponent } from '../../UI/userForms';

export interface TabDef {
  header: string;
  icon: string;
  description: string;
  docType: string;
  docID: string;
}

export const HOME = 'Home';

@Injectable()
export class TabControllerService {

  index = 0;
  tabs: TabDef[] = [];
  tabid: string;
  docID: string;
  HOME = HOME;
  component = new BaseDynamicCompoment(HomeComponent);

  constructor(public db: AngularFireDatabase) {
    const homeTab: TabDef = { header: HOME, docType: HOME, icon: 'home', docID: '', description: '' };
    this.tabs.push(homeTab);
  }

  GetComponent(tab: TabDef) {
    if (tab.docType === 'HOME') { return new BaseDynamicCompoment(HomeComponent); }
    if (!tab.docID) {
        return new BaseDynamicCompoment(getDocListComponent(tab.docType));
    } else {
      return new BaseDynamicCompoment(getDocObjectComponent(tab.docType));
    }
  }

}

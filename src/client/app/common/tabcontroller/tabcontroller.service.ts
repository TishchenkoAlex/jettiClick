import { DocModel } from '../_doc.model';
import { Subject } from 'rxjs/Subject';
import { Component, Injectable } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { HomeComponent } from '../../home/home.component';

import { getDocListComponent, getDocObjectComponent } from '../../UI/userForms';
import { BaseDynamicCompoment } from '../../common/dynamic-component/dynamic-component';

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
  component = new BaseDynamicCompoment(HomeComponent, {});

  constructor(public db: AngularFireDatabase) {
    const homeTab: TabDef = { header: HOME, docType: HOME, icon: 'home', docID: '', description: '' };
    this.tabs.push(homeTab);
  }

  GetComponent(tab: TabDef) {
    if (tab.docType === 'HOME') { return new BaseDynamicCompoment(HomeComponent, {}); }
    if (!tab.docID) {
        return new BaseDynamicCompoment(getDocListComponent(tab.docType), {docType: tab.docType, pageSize: 10});
    } else {
      return new BaseDynamicCompoment(getDocObjectComponent(tab.docType),
        {docType: tab.docType, docID: tab.docID});
    }
  }

}

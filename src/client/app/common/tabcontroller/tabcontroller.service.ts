import { ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit, Injectable } from '@angular/core';
import { Router } from '@angular/router/';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { BaseDynamicCompoment } from '../dynamic-component/dynamic-base.component';
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
  countOfTabs = 0;
  tabs: TabDef[] = [];
  tabid: string;
  docID: string;
  HOME = HOME;
  component = new BaseDynamicCompoment(HomeComponent, {});

  constructor(private router: Router, public db: AngularFireDatabase) {

    const homeTab: TabDef = { header: HOME, docType: HOME, icon: 'home', docID: '', description: '' };
    this.tabs.push(homeTab);

  }

  handleClose(event) {
    if (event) { // если есть евент - значит нажали на крестик закрытия таба
      const index = this.tabs.findIndex(i => (i.docType === event.docType) && (i.docID === event.docID));
      this.index = index;
    }
    this.tabs.splice(this.index, 1);
    if (this.index === this.tabs.length) { this.index-- }

    this.onChange(event);
  }

  onChange(event) {
    const docType = this.tabs[this.index].docType;
    const docID = this.tabs[this.index].docID;
    this.router.navigate([docType, docID])
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

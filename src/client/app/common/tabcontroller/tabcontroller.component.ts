import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, Data } from '@angular/router/';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { DialogComponent } from './../../dialog/dialog.component';
import { Subscription } from 'rxjs/Rx';

import { BaseDynamicCompoment } from '../dynamic-component/dynamic-base.component';
import { HomeComponent } from '../../home/home.component';

import { DocumentService } from '../dynamic-component/document.service';
import { getDocListComponent, getDocObjectComponent } from '../../UI/userForms';

interface TabDef {
  header: string;
  icon: string;
  description: string;
  docType: string;
  docID: string;
}

export const HOME = 'Home';

@Component({
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
  styleUrls: ['./tabcontroller.component.scss']
})
export class TabControllerComponent implements OnInit, OnDestroy {
  index = 0;
  countOfTabs = 0;
  tabs: TabDef[] = [];
  tabid: string;
  docID: string;
  HOME = HOME;
  component = new BaseDynamicCompoment(HomeComponent, {});
  loaded$: Subscription;
  canceled$: Subscription;

  constructor(private route: ActivatedRoute, private router: Router,
    private db: AngularFireDatabase, private ds: DocumentService) {
    const homeTab: TabDef = { header: HOME, docType: HOME, icon: 'home', docID: '', description: '' };
    this.tabs.push(homeTab);
  }

  ngOnInit() {
    this.route.paramMap
      .subscribe((params: ParamMap) => {
        this.tabid = params.get('type') || HOME;
        this.docID = params.get('id') || '';
        const index = this.tabs.findIndex(i => (i.docType === this.tabid) && (i.docID === this.docID));
        if (index === -1) {
          const menuItem = this.db.list('/Menu/main/', { query: { orderByChild: 'link', equalTo: '/' + this.tabid } })
            .take(1)
            .subscribe(item => {
              const newTab: TabDef = { header: item[0].label, docType: this.tabid, icon: item[0].icon, docID: this.docID, description: '' };
              const lastTabIndex = this.tabs.push(newTab);
              this.index = lastTabIndex - 1;
              this.component = this.GetComponent(newTab);
            });
        } else {
          this.index = index;
        }
      });

    this.loaded$ = this.ds.document$.subscribe((doc) => this.onDocLoaded(doc));
    this.canceled$ = this.ds.cancel$.subscribe(() => this.handleClose(null));
  }

  ngOnDestroy() {
    this.loaded$.unsubscribe();
    this.canceled$.unsubscribe();
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

  onDocLoaded(event) {
    this.tabs[this.index].description = (event.description as string).slice(0, 20) || '';
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

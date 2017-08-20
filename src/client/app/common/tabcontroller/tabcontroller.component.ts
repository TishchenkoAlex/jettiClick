import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { DialogComponent } from './../../dialog/dialog.component';
import { Router, ActivatedRoute, ParamMap, Data } from '@angular/router/';
import { Component, OnInit } from '@angular/core';

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
export class TabControllerComponent implements OnInit {
  index = 0;
  countOfTabs = 0;
  tabs: TabDef[] = [];
  tabid: string;
  docID: string;
  HOME = HOME;

  constructor(private route: ActivatedRoute, private router: Router, private db: AngularFireDatabase) {
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
          const menuItem = this.db.list('/Menu/main/', { query: { orderByChild: 'link', equalTo: this.tabid } })
            .take(1)
            .subscribe(item => {
              const newTab: TabDef = { header: item[0].label, docType: this.tabid, icon: item[0].icon, docID: this.docID, description: ''};
              const lastTabIndex = this.tabs.push(newTab);
              this.index = lastTabIndex - 1;
            });
        } else {
          this.index = index;
        }
      });
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
    this.router.navigateByUrl(`${docType}/${docID}`)
  }

  onDocLoaded(event) {
    this.tabs[this.index].description = (event.description as string).slice(0, 20)  || '';
  }

}

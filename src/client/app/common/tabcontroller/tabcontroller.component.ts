import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { DialogComponent } from './../../dialog/dialog.component';
import { Router, ActivatedRoute, ParamMap, Data } from '@angular/router/';
import { Component, OnInit } from '@angular/core';

interface TabDef {
  header: string;
  docType: string;
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
  url = '/store/sessions/Tishchenko/tabs/';
  tabid: string;
  HOME = HOME;

  constructor(private route: ActivatedRoute, private router: Router) {
    const homeTab: TabDef = { header: HOME, docType: HOME};
    this.tabs.push(homeTab);
  }

  ngOnInit() {
    this.route.paramMap
      .subscribe((params: ParamMap) =>  {
        this.tabid = params.get('id') || HOME;
        const index = this.tabs.findIndex(i => i.docType === this.tabid);
        if (index === -1) {
          const header = this.tabid.split('.').slice(-1)[0];
          const newTab: TabDef = {header: header, docType: this.tabid};
          const lastTabIndex = this.tabs.push(newTab);
          this.index = lastTabIndex - 1;
        } else {
          this.index = index;
        }
      });
  }

  handleClose(event) {
    this.tabs.splice(this.index--, 1);
    this.onChange(event);
  }

  onChange(event) {
    const tab = this.tabs[this.index].docType;
    this.router.navigateByUrl(tab);
  }
}

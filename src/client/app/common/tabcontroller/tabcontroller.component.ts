import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { DialogComponent } from './../../dialog/dialog.component';
import { Router, ActivatedRoute, ParamMap, Data } from '@angular/router/';
import { Component, OnInit } from '@angular/core';

interface TabDef {
  closable: boolean;
  header: string;
  docType: string;
}

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

  constructor(private route: ActivatedRoute, private router: Router) {
    const homeTab: TabDef = { closable: false, header: 'Home', docType: 'Home' };
    this.tabs.push(homeTab);
  }

  ngOnInit() {
    this.route.paramMap
      .subscribe((params: ParamMap) =>  {
        const tabid = params.get('id') || 'Home';
        const index = this.tabs.findIndex(i => i.header === tabid);
        if (index === -1) {
          console.log('tabid', tabid);
          const newTab: TabDef = {closable: true, header: tabid, docType: tabid};
          const lastTabIndex = this.tabs.push(newTab);
          this.index = lastTabIndex - 1;
        } else {
          this.index = index;
        }
      });
  }

  handleClose(event) {
    this.tabs.splice(this.index, 1);
    const tab = this.tabs[this.index - 1].header;
    this.router.navigateByUrl(tab);
  }

  onChange(event) {
    const tab = this.tabs[this.index].header;
    this.router.navigateByUrl(tab);
  }
}

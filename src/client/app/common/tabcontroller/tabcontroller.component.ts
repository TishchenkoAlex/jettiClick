import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { TabControllerService, TabDef, HOME } from '../../common/tabcontroller/tabcontroller.service';

@Component({
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
  styleUrls: ['./tabcontroller.component.scss'],
})
export class TabControllerComponent implements OnInit {

  constructor(private route: ActivatedRoute, public tc: TabControllerService) {
  }

  ngOnInit() {
    this.route.paramMap
    .subscribe((params: ParamMap) => {
      this.tc.tabid = params.get('type') || HOME;
      this.tc.docID = params.get('id') || '';
      const index = this.tc.tabs.findIndex(i => (i.docType === this.tc.tabid) && (i.docID === this.tc.docID));
      if (index === -1) {
        const menuItem = this.tc.db.list('/Menu/main/', { query: { orderByChild: 'link', equalTo: '/' + this.tc.tabid } })
          .take(1)
          .subscribe(item => {
            const newTab: TabDef = { header: item[0].label, docType: this.tc.tabid,
              icon: item[0].icon, docID: this.tc.docID, description: '' };
            const lastTabIndex = this.tc.tabs.push(newTab);
            this.tc.index = lastTabIndex - 1;
            this.tc.component = this.tc.GetComponent(newTab);
          });
      } else {
        this.tc.index = index;
      }
    });
  }

}

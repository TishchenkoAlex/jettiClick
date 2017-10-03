import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { HOME, TabControllerService, TabDef } from '../../common/tabcontroller/tabcontroller.service';
import { ViewModel } from '../dynamic-form/dynamic-form.service';
import { DocService } from './../../common/doc.service';

@Component({
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
  styleUrls: ['./tabcontroller.component.scss'],
})
export class TabControllerComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router, private location: Location,
    public tc: TabControllerService, private ds: DocService) {
  }

  ngOnInit() {
    this.route.paramMap
      .subscribe((params: ParamMap) => {
        this.tc.tabid = params.get('type') || HOME;
        this.tc.docID = params.get('id') || '';
        const index = this.tc.tabs.findIndex(i => (i.docType === this.tc.tabid) && (i.docID === this.tc.docID));
        if (index === -1) {
          const menuItem = this.tc.db.list('/Menu/main/', ref => ref.orderByChild('link').equalTo('/' + this.tc.tabid))
            .valueChanges()
            .take(1)
            .subscribe((item: any) => {
              let description = this.tc.docID && this.route.data['value'].detail
                ? (this.route.data['value'].detail as ViewModel).model.description : '';
              description = description.length > 25 ? description.slice(0, 22) + '...' : description;
              const newTab: TabDef = {
                header: item[0].label, docType: this.tc.tabid,
                icon: item[0].icon, docID: this.tc.docID, description: description
              };
              const lastTabIndex = this.tc.tabs.push(newTab);
              this.tc.index = lastTabIndex - 1;
              this.tc.component = this.tc.GetComponent(newTab);
            });
        } else {
          this.tc.index = index;
        }
      });

    this.ds.close$
      .subscribe(doc => {
        this.tc.tabs.splice(this.tc.index, 1);
        if (this.tc.index === this.tc.tabs.length) { this.tc.index-- };
        this.location.back();
      });
  }

  private handleClose(event) {
    if (event) { // если есть евент - значит нажали на крестик закрытия таба
      const index = this.tc.tabs.findIndex(i => (i.docType === event.docType) && (i.docID === event.docID));
      this.tc.index = index;
    }
    this.tc.tabs.splice(this.tc.index, 1);
    if (this.tc.index === this.tc.tabs.length) { this.tc.index-- }

    this.onChange(event);
  }

  onChange(event) {
    const docType = this.tc.tabs[this.tc.index].docType;
    const docID = this.tc.tabs[this.tc.index].docID;
    this.router.navigate([docType, docID]);
  }
}

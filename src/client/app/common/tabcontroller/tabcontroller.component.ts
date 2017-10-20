import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { HOME, TabControllerService, TabDef } from '../../common/tabcontroller/tabcontroller.service';
import { ViewModel } from '../dynamic-form/dynamic-form.service';
import { DocService } from './../../common/doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
  styleUrls: ['./tabcontroller.component.scss'],
})
export class TabControllerComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router, private location: Location,
    public tcs: TabControllerService, private ds: DocService, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.route.paramMap.filter(el => this.tcs.menuItems.length > 0)
      .subscribe((params: ParamMap) => {
        this.tcs.tabid = params.get('type') || HOME;
        this.tcs.docID = params.get('id') || '';
        const index = this.tcs.tabs.findIndex(i => (i.docType === this.tcs.tabid) && (i.docID === this.tcs.docID));
        if (index === -1) {
          Promise.resolve().then(() => {
            const menuItem = this.tcs.menuItems.find(el => el.type === this.tcs.tabid);
            let description = this.tcs.docID && this.route.data['value'].detail
              ? (this.route.data['value'].detail as ViewModel).model.description : '';
            description = description.length > 25 ? description.slice(0, 22) + '...' : description;
            const newTab: TabDef = {
              header: menuItem.description, docType: this.tcs.tabid,
              icon: menuItem.icon, docID: this.tcs.docID, description: description
            };
            const lastTabIndex = this.tcs.tabs.push(newTab);
            this.tcs.index = lastTabIndex - 1;
            this.tcs.component = this.tcs.GetComponent(newTab);
            this.cd.detectChanges();
          });
        } else { this.tcs.index = index }
        this.cd.detectChanges();
      });

    this.ds.close$
      .subscribe(doc => {
        this.tcs.tabs.splice(this.tcs.index, 1);
        if (this.tcs.index === this.tcs.tabs.length) { this.tcs.index-- };
        this.location.back();
      });
  }

  private handleClose(event) {
    if (event) { // если есть евент - значит нажали на крестик закрытия таба
      const index = this.tcs.tabs.findIndex(i => (i.docType === event.docType) && (i.docID === event.docID));
      this.tcs.index = index;
    }
    this.tcs.tabs.splice(this.tcs.index, 1);
    if (this.tcs.index === this.tcs.tabs.length) { this.tcs.index-- }

    this.onChange(event);
  }

  onChange(event) {
    const docType = this.tcs.tabs[this.tcs.index].docType;
    const docID = this.tcs.tabs[this.tcs.index].docID;
    this.router.navigate([docType, docID]);
  }
}

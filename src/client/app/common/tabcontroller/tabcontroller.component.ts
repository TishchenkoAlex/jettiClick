import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';

import { DocModel } from '../../../../server/modules/doc.base';
import { HOME, TabControllerService, TabDef } from '../../common/tabcontroller/tabcontroller.service';
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
    Observable.combineLatest(this.route.paramMap, this.route.queryParams).pipe(
      filter(() => this.tcs.menuItems.length > 0),
    ).subscribe((params) => {
      this.tcs.tabid = params[0].get('type') || HOME;
      this.tcs.docID = params[0].get('id') || '';
      this.tcs.params = params[1];

      const index = this.tcs.tabs.findIndex(i => (i.docType === this.tcs.tabid) && (i.docID === this.tcs.docID))
      if (index === -1) {
        let menuItem = this.tcs.menuItems.find(el => el.type === this.tcs.tabid);
        if (!menuItem) { menuItem = { type: HOME, icon: 'home', description: '', menu: HOME } }
        const description = this.tcs.docID ? menuItem.description : menuItem.menu;
        const newTab: TabDef = {
          header: description, docType: this.tcs.tabid, icon: menuItem.icon,
          docID: this.tcs.docID, description: description, params: params[1]
        };
        let lastTabIndex;
        if (this.tcs.tabid === HOME) { lastTabIndex = this.tcs.tabs.unshift(newTab) } else { lastTabIndex = this.tcs.tabs.push(newTab) }
        this.tcs.component = this.tcs.GetComponent(newTab);
        this.tcs.index = lastTabIndex - 1;
      } else { this.tcs.index = index }
      this.cd.markForCheck();
    });

    this.ds.close$.pipe(filter(data => data === null))
      .subscribe(doc => {
        this.tcs.tabs.splice(this.tcs.index, 1);
        if (this.tcs.index === this.tcs.tabs.length) { this.tcs.index-- };
      });

    this.route.data.pipe(filter(r => r.detail)).subscribe(data => {
      const t = this.tcs.tabs.find(i => (i.docType === this.tcs.tabid) && (i.docID === this.tcs.docID));
      if (t && data.detail && data.detail.model && data.detail.model.description) {
        t.description = data.detail.model.description;
      }
    });

    this.router.navigate([HOME]);
  }

  private handleClose(event: Event, tab: TabDef) {
    event.stopPropagation();
    this.tcs.index = this.tcs.tabs.findIndex(el => el.docType === tab.docType && el.docID === tab.docID);
    const doc = new DocModel(tab.docType, tab.docID)
    this.ds.close(doc);
  }

  onChange(event) {
    const docType = this.tcs.tabs[this.tcs.index].docType;
    const docID = this.tcs.tabs[this.tcs.index].docID;
    const queryParams = this.tcs.tabs[this.tcs.index].params;
    this.router.navigate([docType, docID], { queryParams: queryParams });
  }
}

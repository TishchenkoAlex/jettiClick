import { HomeComponent } from '../../home/home.component';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';

import { HOME, TabControllerService, TabDef } from '../../common/tabcontroller/tabcontroller.service';
import { DocService } from './../../common/doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.png.component.html',
})
export class TabControllerComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router,
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
        const menuItem = this.tcs.menuItems.find(el => el.type === this.tcs.tabid);
        const description = this.tcs.docID ? menuItem.description : menuItem.menu;
        const newTab: TabDef = {
          header: description, docType: this.tcs.tabid, icon: menuItem.icon,
          docID: this.tcs.docID, description: description, params: params[1],
          component: this.tcs.GetComponent(this.tcs.tabid, this.tcs.docID)
        };
        this.tcs.tabs.push(newTab);
        setTimeout(() => { this.tcs.index = this.tcs.tabs.length - 1; this.cd.markForCheck() });
      } else { this.tcs.index = index; setTimeout(() => this.cd.markForCheck())};
      this.cd.markForCheck();
    });

    this.ds.close$.pipe(filter(data => data === null))
      .subscribe(doc => {
        this.tcs.tabs.splice(this.tcs.index, 1);
        if (this.tcs.index === this.tcs.tabs.length) { this.tcs.index-- };
        this.onChange(this.tcs.index);
        this.cd.markForCheck();
      });

    this.route.data.pipe(filter(r => r.detail)).subscribe(data => {
      const t = this.tcs.tabs.find(i => (i.docType === this.tcs.tabid) && (i.docID === this.tcs.docID));
      if (t && data.detail && data.detail.model && data.detail.model.description) {
        t.description = data.detail.model.description;
      }
    });
  }

  handleClose(event) {
    this.tcs.index = event;
    this.ds.close(<any>{id: this.tcs.tabs[event].docID, type: this.tcs.tabs[event].docType});
    setTimeout(() => this.cd.markForCheck());
  }

  onChange(event) {
    this.tcs.index = event;
    const docType = this.tcs.tabs[event].docType;
    const docID = this.tcs.tabs[event].docID;
    this.router.navigate([docType, docID]).then(() => this.cd.markForCheck());
  }
}

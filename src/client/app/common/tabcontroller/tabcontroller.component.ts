import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HOME, TabControllerService, TabDef } from '../../common/tabcontroller/tabcontroller.service';
import { DocService } from './../../common/doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
})
export class TabControllerComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router,
    public tcs: TabControllerService, private ds: DocService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    setTimeout(() => this.cd.detectChanges());

    this.route.url.pipe(
      filter(params => this.tcs.menuItems.length > 0)).subscribe(params => this.changeTab(params));

    this.ds.close$.pipe(filter(url => !!!url.skip))
      .subscribe(url => {
        const index = this.tcs.tabs.findIndex(i => i.routerLink === url.url);
        if (index === -1) { return; }
        this.tcs.tabs.splice(index, 1);
        if (this.tcs.index >= this.tcs.tabs.length) { this.tcs.index = this.tcs.tabs.length - 1; }
        this.onChange(this.tcs.index);
        this.cd.detectChanges();
      });

    this.route.data.pipe(filter(r => r.detail && r.detail.model)).subscribe(data => {
      const t = this.tcs.tabs.find(i => i.routerLink === this.router.url);
      t.description = data.detail.model.description;
    });
  }

  private changeTab(params) {
    this.tcs.tabid = this.route.snapshot.params.type || HOME;
    this.tcs.docID = this.route.snapshot.params.id || '';
    const index = this.tcs.tabs.findIndex(i => i.routerLink === this.router.url);
    if (index === -1) {
      const menuItem = this.tcs.menuItems.find(el => el.type === this.tcs.tabid) ||
        { icon: '', label: this.tcs.tabid.split('.')[1], type: this.tcs.tabid, routerLink: ['/' + this.tcs.tabid] };
      const newTab: TabDef = {
        header: menuItem.label, docType: this.tcs.tabid, icon: menuItem.icon,
        docID: this.tcs.docID, description: menuItem.label,
        component: this.tcs.GetComponent(this.tcs.tabid, this.tcs.docID), routerLink: this.router.url
      };
      this.tcs.tabs.push(newTab);
      setTimeout(() => { this.tcs.index = this.tcs.tabs.length - 1; this.cd.detectChanges(); });
    } else {
      this.tcs.index = index;
    }
    this.cd.detectChanges();
  }

  handleClose(event) {
    this.tcs.index = event;
    this.ds.close$.next({ url: this.tcs.tabs[event].routerLink, skip: true });
  }

  onChange(event) {
    this.router.navigateByUrl(this.tcs.tabs[event].routerLink, { queryParams: {} }).then(() => this.cd.detectChanges());
    this.cd.markForCheck();
  }
}

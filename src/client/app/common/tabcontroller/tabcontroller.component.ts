import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs/observable/combineLatest';
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
    public tcs: TabControllerService, private ds: DocService, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    combineLatest(this.route.paramMap, this.route.queryParams).pipe(
      filter(() => this.tcs.menuItems.length > 0),
    ).subscribe((params) => {
      this.tcs.tabid = params[0].get('type') || HOME;
      this.tcs.docID = params[0].get('id') || '';
      this.tcs.params = params[1];
      const index = this.tcs.tabs.findIndex(i => (i.docType === this.tcs.tabid) && (i.docID === this.tcs.docID));
      if (index === -1) {
        const menuItem = this.tcs.menuItems.find(el => el.type === this.tcs.tabid) ||
          { icon: '', label: this.tcs.tabid.split('.')[1], type: this.tcs.tabid, routerLink: ['/' + this.tcs.tabid] };
        const newTab: TabDef = {
          header: menuItem.label, docType: this.tcs.tabid, icon: menuItem.icon,
          docID: this.tcs.docID, description: menuItem.label, params: params[1],
          component: this.tcs.GetComponent(this.tcs.tabid, this.tcs.docID)
        };
        this.tcs.tabs.push(newTab);
        setTimeout(() => { this.tcs.index = this.tcs.tabs.length - 1; this.cd.detectChanges(); });
      } else { this.tcs.index = index; }
      this.cd.detectChanges();
    });

    this.ds.close$.pipe(filter(doc => doc && !!doc['close']))
      .subscribe(doc => {
        const index = this.tcs.tabs.findIndex(i => (i.docType === doc.type) && (i.docID === doc.id));
        this.tcs.tabs.splice(index, 1);
        if (this.tcs.index >= this.tcs.tabs.length) { this.tcs.index = this.tcs.tabs.length - 1; }
        this.onChange(this.tcs.index);
        this.cd.detectChanges();
      });

    this.route.data.pipe(filter(r => r.detail)).subscribe(data => {
      const t = this.tcs.tabs.find(i => (i.docType === this.tcs.tabid) && (i.docID === this.tcs.docID));
      if (t && data.detail && data.detail.model && data.detail.model.description) {
        t.description = data.detail.model.description;
      }
    });
    this.cd.detectChanges();
  }

  handleClose(event) {
    this.tcs.index = event;
    this.ds.close$.next(<any>{ id: this.tcs.tabs[event].docID, type: this.tcs.tabs[event].docType });
    }

  onChange(event) {
    const docType = this.tcs.tabs[event].docType;
    const docID = this.tcs.tabs[event].docID;
    this.router.navigate([docType, docID]);
    this.cd.detectChanges();
  }
}

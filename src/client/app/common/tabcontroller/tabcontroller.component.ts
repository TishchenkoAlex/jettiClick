import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { INoSqlDocument } from '../../../../server/models/ServerDocument';
import { TabDef, TabsStore } from './tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
})
export class TabControllerComponent {

  constructor(private router: Router, private route: ActivatedRoute, private tabStore: TabsStore) {

    this.route.paramMap
      .subscribe(paramMap => {
        const type = paramMap.get('type') || '';
        const id = paramMap.get('id') || '';
        const index = tabStore.state.tabs.findIndex(el => el.routerLink === this.router.url);
        if (index > -1) {
          this.tabStore.selectedIndex = index;
        } else {
          const newLink: TabDef = {
            docType: type, docID: id, icon: 'list', routerLink: this.router.url, header: type
          };
          tabStore.push(newLink);
          setTimeout(() => { this.tabStore.selectedIndex = this.tabStore.selectedIndex; });
        }
      });

    this.route.data.pipe(filter(data => data.detail))
      .subscribe(data => {
        if (data.detail.formGroup instanceof FormGroup) {
          const doc = data.detail.formGroup.getRawValue() as INoSqlDocument;
          const tab = tabStore.state.tabs.find(i => (i.routerLink === this.router.url));
          if (tab) {
            tab.header = doc.description;
            tabStore.replace(tab);
          }
        } else {
          if (data.detail instanceof Array) {
            const tab = tabStore.state.tabs.find(i => (i.docType === data.detail[0].metadata.type) && (i.docID === ''));
            if (tab) {
              tab.header = data.detail[0].metadata.menu;
              tabStore.replace(tab);
            }
          }
        }
      });
  }

  selectedIndexChange(event: number) {
    const tab = this.tabStore.state.tabs[event];
    this.router.navigateByUrl(tab.routerLink);
  }

  handleClose(event: number) {
    this.tabStore.close(this.tabStore.state.tabs[event]);
    this.selectedIndexChange(this.tabStore.state.selectedIndex);
  }
}

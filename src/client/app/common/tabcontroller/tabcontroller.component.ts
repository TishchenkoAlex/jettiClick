import { ChangeDetectionStrategy, Component, ViewChild, QueryList, ContentChildren, ViewChildren } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { INoSqlDocument } from '../../../../server/models/ServerDocument';
import { TabDef, TabsStore } from './tabs.store';
import { DynamicComponent } from '../dynamic-component/dynamic-component';
import { BaseDocListComponent } from '../datatable/base.list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
})
export class TabControllerComponent {
  @ViewChildren(DynamicComponent) components: QueryList<DynamicComponent>;

  constructor(private router: Router, private route: ActivatedRoute, public tabStore: TabsStore) {
    this.route.params
      .subscribe(params => {
        const type = params.type || '';
        const id = params.id || '';
        const index = tabStore.state.tabs.findIndex(el => el.routerLink === this.router.url);
        if (index > -1) {
          this.tabStore.selectedIndex = index;
        } else {
          const newLink: TabDef = {
            docType: type, docID: id, icon: 'list', routerLink: this.router.url, header: type
          };
          tabStore.push(newLink);
        }
        setTimeout(() => { this.tabStore.selectedIndex = this.tabStore.selectedIndex; });
      });

    this.route.data.pipe(filter(data => data.detail))
      .subscribe(data => {
        if (data.detail instanceof FormGroup) {
          const doc = data.detail.getRawValue() as INoSqlDocument;
          const tab = tabStore.state.tabs.find(i => (i.routerLink === this.router.url));
          if (tab) {
            tab.header = doc.description || tab.docType;
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
    this.router.navigateByUrl(tab.routerLink)
      .then(() => this.tabStore.selectedIndex = this.tabStore.selectedIndex);
  }

  handleClose(event) {
    event.originalEvent.stopPropagation();
    const tab = this.tabStore.state.tabs[event.index];
    const component = this.components.find(e => e.type === tab.docType && e.id === tab.docID && e.kind === 'form');
    if (component && component.componentRef.instance.Close) {
      component.componentRef.instance.Close();
    } else {
      this.tabStore.close(tab);
    }
    this.selectedIndexChange(this.tabStore.state.selectedIndex);
  }
}

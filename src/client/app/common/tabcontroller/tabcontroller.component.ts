import { ChangeDetectionStrategy, ChangeDetectorRef, Component, QueryList, ViewChildren } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { INoSqlDocument } from '../../../../server/models/ServerDocument';
import { DynamicComponent } from '../dynamic-component/dynamic-component';
import { TabDef, TabsStore } from './tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
})
export class TabControllerComponent {
  @ViewChildren(DynamicComponent) components: QueryList<DynamicComponent>;

  constructor(private router: Router, private route: ActivatedRoute, public tabStore: TabsStore, private cd: ChangeDetectorRef) {

    this.route.params
      .subscribe(params => {
        const index = tabStore.state.tabs.findIndex(el => el.docType === params.type && el.docID === (params.id || ''));
        if (index > -1) {
          setTimeout(() => this.tabStore.selectedIndex = index);
        } else {
          const newLink: TabDef = {
            docType: params.type, docID: (params.id || ''), icon: 'list', routerLink: this.router.url, header: params.type
          };
          tabStore.push(newLink);
          setTimeout(() => this.tabStore.selectedIndex = this.tabStore.selectedIndex);
        }
      });

    this.route.data.pipe(filter(data => data.detail))
      .subscribe(data => {
        if (data.detail instanceof FormGroup) {
          const doc = data.detail.getRawValue() as INoSqlDocument;
          const tab = tabStore.state.tabs.find(i => (i.docType === doc.type && i.docID === doc.id));
          if (tab) {
            tab.header = doc.description || tab.docType;
            tabStore.replace(tab);
          }
        } else {
          if (data.detail instanceof Array) {
            const tab = tabStore.state.tabs.find(i => (i.docType === data.detail[0].metadata.type) && !i.docID);
            if (tab) {
              tab.header = data.detail[0].metadata.menu;
              tabStore.replace(tab);
            }
          }
        }
      });
  }

  selectedIndexChange(event) {
    event.originalEvent.stopPropagation();
    this.router.navigateByUrl(this.tabStore.state.tabs[event.index].routerLink);
  }

  handleClose(event) {
    event.originalEvent.stopPropagation();
    const tab = this.tabStore.state.tabs[event.index];
    const component = this.components.find(e => e.id === tab.docID);
    if (component && component.componentRef.instance.Close) {
      return component.componentRef.instance.Close();
    } else {
      this.tabStore.close(tab);
      this.router.navigateByUrl(this.tabStore.state.tabs[this.tabStore.state.selectedIndex].routerLink);
    }
  }
}

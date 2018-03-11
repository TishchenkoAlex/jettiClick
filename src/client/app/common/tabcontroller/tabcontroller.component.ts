import { ChangeDetectionStrategy, ChangeDetectorRef, Component, QueryList, ViewChildren } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { merge } from 'rxjs/observable/merge';
import { filter } from 'rxjs/operators';

import { INoSqlDocument } from '../../../../server/models/ServerDocument';
import { DocService } from '../doc.service';
import { DynamicComponent } from '../dynamic-component/dynamic-component';
import { TabDef, TabsStore } from './tabs.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
})
export class TabControllerComponent {
  @ViewChildren(DynamicComponent) components: QueryList<DynamicComponent>;

  constructor(
    private router: Router, private route: ActivatedRoute, private ds: DocService,
    public tabStore: TabsStore, private cd: ChangeDetectorRef) {

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

    this.route.data.pipe(filter(data => data.detail)).subscribe(this.updateTabTitle(tabStore));

    merge(...[this.ds.save$, this.ds.delete$]).pipe(filter(doc => doc.id === this.route.snapshot.params.id))
      .subscribe(doc => {
        const tab = tabStore.state.tabs.find(i => i.docID === doc.id);
        if (tab) {
          tab.header = doc.description;
          tabStore.replace(tab);
        }
      });
  }

  private updateTabTitle(tabStore: TabsStore) {
    return data => {
      if (data.detail instanceof FormGroup) {
        const doc = data.detail.getRawValue() as INoSqlDocument;
        const tab = tabStore.state.tabs.find(i => (i.docType === doc.type && i.docID === doc.id));
        if (tab) {
          tab.header = doc.description || tab.docType;
          tab.icon = data.detail['metadata'].icon;
          tabStore.replace(tab);
        }
      } else {
        if (data.detail.metadata) {
          const tab = tabStore.state.tabs.find(i => (i.docType === data.detail.metadata.type) && !i.docID);
          if (tab) {
            tab.header = data.detail.metadata.menu;
            tab.icon = data.detail.metadata.icon;
            tabStore.replace(tab);
          }
        }
      }
    };
  }

  selectedIndexChange(event) {
    event.originalEvent.stopPropagation();
    const tab = this.tabStore.state.tabs[event.index];
    this.router.navigate([tab.docType, tab.docID]);
  }

  handleClose(event) {
    event.originalEvent.stopPropagation();
    const tab = this.tabStore.state.tabs[event.index];
    const component = this.components.find(e => e.id === tab.docID);
    if (component && component.componentRef.instance.Close) {
      return component.componentRef.instance.Close();
    } else {
      this.tabStore.close(tab);
      const returnTab = this.tabStore.state.tabs[this.tabStore.state.selectedIndex];
      this.router.navigate([returnTab.docType, returnTab.docID])
        .then(() => setTimeout(() => this.tabStore.selectedIndex = this.tabStore.selectedIndex));
    }
  }
}

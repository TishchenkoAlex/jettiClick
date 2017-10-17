import { Auth0Service } from './auth/auth0.service';
import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { Component, OnInit } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { ApiService } from './services/api.service';
import { SideNavService } from './services/side-nav.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  menuCatalogItems: Observable<any[]>;
  menuDocItems: Observable<any[]>;

  loading$: Observable<boolean>;

  selectedItem; // this.users[0];
  isDarkTheme = false;
  sideNav = { mode: 'side', opened: true };

  constructor(media: ObservableMedia, private router: Router, public auth: Auth0Service,
    public sideNavService: SideNavService, private apiService: ApiService, private tsc: TabControllerService) {

    media.asObservable().subscribe((change: MediaChange) => this.switchMedia(change));

    auth.handleAuthentication();
    this.auth.userProfile$.subscribe(userProfile => {
      tsc.menuItems.length = 0;
      this.menuCatalogItems = apiService.getCatalogs().do(data => { tsc.menuItems.push.apply(tsc.menuItems, data) });
      this.menuDocItems = apiService.getDocuments().do(data => { tsc.menuItems.push.apply(tsc.menuItems, data) });
    })
  }

  ngOnInit() {
    this.loading$ = this.router.events
      .map(event => !(event instanceof NavigationEnd));
  }

  private switchMedia(change: MediaChange) {
    if (change.mqAlias === 'xs' || change.mqAlias === 'sm') {
      this.sideNav.mode = 'push';
      this.sideNav.opened = false;
    } else {
      this.sideNav.mode = 'side';
      this.sideNav.opened = true;
    }
  }

}

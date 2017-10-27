import { LoadingService } from './common/loading.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Auth0Service } from './auth/auth0.service';
import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';
import { SideNavService } from './services/side-nav.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  {

  menuCatalogItems: Observable<any[]>;
  menuDocItems: Observable<any[]>;

  selectedItem; // this.users[0];
  isDarkTheme = false;
  sideNav = { mode: 'side', opened: true };

  constructor(media: ObservableMedia, private router: Router, private auth: Auth0Service,
    public sideNavService: SideNavService, private apiService: ApiService, public lds: LoadingService,
    private tsc: TabControllerService, private cd: ChangeDetectorRef) {

    media.asObservable().subscribe((change: MediaChange) => this.switchMedia(change));

    auth.handleAuthentication();
    this.auth.userProfile$.subscribe(userProfile => {
      tsc.menuItems.length = 0;
      this.menuCatalogItems = apiService.getCatalogs().do(data => tsc.menuItems.push.apply(tsc.menuItems, data));
      this.menuDocItems = apiService.getDocuments().do(data => tsc.menuItems.push.apply(tsc.menuItems, data));
      this.cd.markForCheck();
    })
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

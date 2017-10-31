import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { share, take } from 'rxjs/operators';

import { MenuItem } from '../../server/models/api';
import { Auth0Service } from './auth/auth0.service';
import { UserSettingsService } from './auth/settings/user.settings.service';
import { LoadingService } from './common/loading.service';
import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';
import { SideNavService } from './services/side-nav.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  menuCatalogItems: Observable<MenuItem[]>;
  menuDocItems: Observable<MenuItem[]>;

  selectedItem; // this.users[0];
  isDarkTheme = false;
  sideNav = { mode: 'side', opened: true };

  constructor(media: ObservableMedia, private router: Router, private auth: Auth0Service, private ups: UserSettingsService,
    public sideNavService: SideNavService, private apiService: ApiService, public lds: LoadingService,
    private tsc: TabControllerService, private cd: ChangeDetectorRef) {

    media.asObservable().subscribe((change: MediaChange) => this.switchMedia(change));

    auth.handleAuthentication();

    this.auth.userProfile$.subscribe(userProfile => {
      this.menuCatalogItems = apiService.getCatalogs().pipe(share(), take(1));
      this.menuDocItems = apiService.getDocuments().pipe(share(), take(1));
      Observable.forkJoin(this.menuCatalogItems, this.menuDocItems).pipe(take(1))
        .subscribe(data => {
          tsc.menuItems.push(...data[0], ...data[1]);
          localStorage.setItem('menuItems', JSON.stringify(tsc.menuItems));
        });
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

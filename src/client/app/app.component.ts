import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/components/common/messageservice';
import { Observable } from 'rxjs/Observable';
import { share, take } from 'rxjs/operators';

import { MenuItem } from '../../server/models/api';
import { Auth0Service } from './auth/auth0.service';
import { UserSettingsService } from './auth/settings/user.settings.service';
import { LoadingService } from './common/loading.service';
import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { ApiService } from './services/api.service';
import { SideNavService } from './services/side-nav.service';

enum MenuOrientation { STATIC, OVERLAY, SLIM, HORIZONTAL }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  menuCatalogItems: Observable<MenuItem[]>;
  menuDocItems: Observable<MenuItem[]>;

  layoutCompact = true;

  layoutMode: MenuOrientation = MenuOrientation.STATIC;

  darkMenu = false;

  profileMode = 'inline';

  rotateMenuButton: boolean;

  topbarMenuActive: boolean;

  overlayMenuActive: boolean;

  staticMenuDesktopInactive: boolean;

  staticMenuMobileActive: boolean;

  rightPanelActive: boolean;

  rightPanelClick: boolean;

  layoutMenuScroller: HTMLDivElement;

  menuClick: boolean;

  topbarItemClick: boolean;

  activeTopbarItem: any;

  resetMenu: boolean;

  menuHoverActive: boolean;

  @ViewChild('layoutMenuScroller') layoutMenuScrollerViewChild: ElementRef;

  constructor(private router: Router, private auth: Auth0Service, private ups: UserSettingsService,
    public sideNavService: SideNavService, private apiService: ApiService, public lds: LoadingService,
    public tsc: TabControllerService, private cd: ChangeDetectorRef, private messageService: MessageService) {

    auth.handleAuthentication();

    this.auth.userProfile$.subscribe(userProfile => {
      this.menuCatalogItems = apiService.getCatalogs().pipe(share(), take(1));
      this.menuDocItems = apiService.getDocuments().pipe(share(), take(1));
      Observable.forkJoin(this.menuCatalogItems, this.menuDocItems).pipe(take(1))
        .subscribe(data => {
          tsc.menuItems = [...data[0], ...data[1]];
          localStorage.setItem('menuItems', JSON.stringify(tsc.menuItems));
        });
    });

    this.messageService.messageObserver.subscribe(() => {
      // setTimeout(() => this.cd.markForCheck(), 4000);
    });
  }

  ngAfterViewInit() {
    this.layoutMenuScroller = <HTMLDivElement>this.layoutMenuScrollerViewChild.nativeElement;
  }

  onLayoutClick() {
    if (!this.topbarItemClick) {
      this.activeTopbarItem = null;
      this.topbarMenuActive = false;
    }

    if (!this.menuClick) {
      if (this.isHorizontal() || this.isSlim()) {
        this.resetMenu = true;
      }

      if (this.overlayMenuActive || this.staticMenuMobileActive) {
        this.hideOverlayMenu();
      }

      this.menuHoverActive = false;
    }

    if (!this.rightPanelClick) {
      this.rightPanelActive = false;
    }

    this.topbarItemClick = false;
    this.menuClick = false;
    this.rightPanelClick = false;
  }

  onMenuButtonClick(event) {
    this.menuClick = true;
    this.rotateMenuButton = !this.rotateMenuButton;
    this.topbarMenuActive = false;

    if (this.layoutMode === MenuOrientation.OVERLAY) {
      this.overlayMenuActive = !this.overlayMenuActive;
    } else {
      if (this.isDesktop()) {
        this.staticMenuDesktopInactive = !this.staticMenuDesktopInactive;
      } else {
        this.staticMenuMobileActive = !this.staticMenuMobileActive;
      }
    }
    event.preventDefault();
  }

  onMenuClick($event) {
    this.menuClick = true;
    this.resetMenu = false;
  }

  onTopbarMenuButtonClick(event) {
    this.topbarItemClick = true;
    this.topbarMenuActive = !this.topbarMenuActive;
    this.hideOverlayMenu();
    event.preventDefault();
  }

  onTopbarItemClick(event, item) {
    this.topbarItemClick = true;
    if (this.activeTopbarItem === item) {
      this.activeTopbarItem = null;
    } else {
      this.activeTopbarItem = item;
    }
    event.preventDefault();
  }

  onRightPanelButtonClick(event) {
    this.rightPanelClick = true;
    this.rightPanelActive = !this.rightPanelActive;
    event.preventDefault();
  }

  onRightPanelClick() {
    this.rightPanelClick = true;
  }

  hideOverlayMenu() {
    this.rotateMenuButton = false;
    this.overlayMenuActive = false;
    this.staticMenuMobileActive = false;
  }

  isTablet() {
    const width = window.innerWidth;
    return width <= 1024 && width > 640;
  }

  isDesktop() {
    return window.innerWidth > 1024;
  }

  isMobile() {
    return window.innerWidth <= 640;
  }

  isOverlay() {
    return this.layoutMode === MenuOrientation.OVERLAY;
  }

  isHorizontal() {
    return this.layoutMode === MenuOrientation.HORIZONTAL;
  }

  isSlim() {
    return this.layoutMode === MenuOrientation.SLIM;
  }

  changeToStaticMenu() {
    this.layoutMode = MenuOrientation.STATIC;
  }

  changeToOverlayMenu() {
    this.layoutMode = MenuOrientation.OVERLAY;
  }

  changeToHorizontalMenu() {
    this.layoutMode = MenuOrientation.HORIZONTAL;
  }

  changeToSlimMenu() {
    this.layoutMode = MenuOrientation.SLIM;
  }

}

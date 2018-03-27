import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

import { AuthService } from './auth/auth.service';
import { LoadingService } from './common/loading.service';
import { ApiService } from './services/api.service';

// import { Store } from '@ngrx/store';
// import * as fromRoot from './store/reducers';

enum MenuOrientation { STATIC, OVERLAY, SLIM, HORIZONTAL }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

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

  constructor(
    public auth: AuthService, public apiService: ApiService, public lds: LoadingService, private swUpdate: SwUpdate) {

    const lm = localStorage.getItem('layoutMode');
    const a = this.layoutMode.toString();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
        if (confirm('New version available. Load New Version?')) {
          window.location.reload();
        }
      });

    }

    // store.select(fromRoot.getAccount).subscribe(data => console.log('getAccount', data));
    // this.store.dispatch(new Auth.Login({email: 'tischenko.a@gmail.com', password: 'Pa$$word'}));
    // store.select(fromRoot.getColor).subscribe(data => console.log('getColor', data));
    // this.store.dispatch(new UI.SetColor({color: 'accent'}));
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
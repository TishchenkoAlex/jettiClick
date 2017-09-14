import { Observable } from 'rxjs/Observable';
import { Component, OnInit } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { NavigationEnd, NavigationStart, Router, RoutesRecognized } from '@angular/router';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  menuItems: FirebaseListObservable<any[]>;

  docs: FirebaseListObservable<any[]>;

  loading$: Observable<boolean>;

  selectedItem; // this.users[0];
  isDarkTheme = false;
  sideNav = {
    mode: 'side',
    opened: true
  };

  constructor(media: ObservableMedia, private db: AngularFireDatabase, private router: Router) {

    media.asObservable().subscribe((change: MediaChange) => this.switchMedia(change));

    this.menuItems = db.list('/Menu/main/');
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

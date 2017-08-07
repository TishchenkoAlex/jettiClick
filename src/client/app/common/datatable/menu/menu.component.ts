import { Component } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';

import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-memu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  menuItems: FirebaseListObservable<any[]>;

  selectedItem; // this.users[0];
  isDarkTheme = false;
  sideNav = {
    mode: 'side',
    opened: true
  };

  constructor(media: ObservableMedia, private db: AngularFireDatabase) {

    media.asObservable().subscribe((change: MediaChange) => this.switchMedia(change));

    this.menuItems = db.list('/Menu/main/');
  }

  private switchMedia(change: MediaChange) {
    if (change.mqAlias === 'xs') {
      this.sideNav.mode = 'push';
      this.sideNav.opened = false;
    } else {
      this.sideNav.mode = 'side';
      this.sideNav.opened = true;
    }
  }

}

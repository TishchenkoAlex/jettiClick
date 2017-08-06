import { Component } from '@angular/core';
import { MdDialog } from '@angular/material';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';

import { DialogComponent } from './dialog/dialog.component';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  users: FirebaseListObservable<any[]>;

  selectedUser; // this.users[0];
  isDarkTheme = false;
  sideNav = {
    mode: 'side',
    opened: true
  };

  constructor(
    private dialog: MdDialog, media: ObservableMedia,
    private db: AngularFireDatabase) {

    media.asObservable().subscribe((change: MediaChange) => this.switchMedia(change));

    this.users = db.list('/Menu/main/');
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

  private openAdminDialog() {
    this.dialog.open(DialogComponent).afterClosed()
      .filter(result => !!result)
      .subscribe(user => {
        this.users.push(user);
        this.selectedUser = user;
      });
  }

}

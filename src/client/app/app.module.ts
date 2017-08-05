import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/filter';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FlexLayoutModule} from '@angular/flex-layout';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import {DialogComponent} from './dialog/dialog.component';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import {
  MdToolbarModule,
  MdSidenavModule,
  MdTabsModule,
  MdListModule,
  MdIconModule,
  MdSlideToggleModule,
  MdCardModule,
  MdMenuModule,
  MdButtonModule,
  MdDialogModule,
  MdInputModule,
  MdSelectModule,
  MdOptionModule,
  MdCheckboxModule
} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    DialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    MdToolbarModule,
    MdSidenavModule,
    MdTabsModule,
    MdListModule,
    MdIconModule,
    MdSlideToggleModule,
    MdCardModule,
    MdMenuModule,
    MdButtonModule,
    MdDialogModule,
    MdInputModule,
    MdSelectModule,
    MdOptionModule,
    MdCheckboxModule,

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
  ],
  providers: [],
  entryComponents: [DialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }

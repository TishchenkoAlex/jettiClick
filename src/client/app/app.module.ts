import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FlexLayoutModule} from '@angular/flex-layout';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

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
  MdCheckboxModule,
  MdTableModule,
  MdPaginatorModule,
  MdSortModule,
  MdNativeDateModule,
} from '@angular/material';

import { ApiService } from './services/api.service';
import { commonDataTableComponent, ApiDataSource } from './common/datatable/datatable.component';
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { MenuComponent } from './common/datatable/menu/menu.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    commonDataTableComponent,
  ],
  imports: [
    CdkTableModule,
    BrowserModule,
    FormsModule,
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
    MdTableModule,
    MdPaginatorModule,
    MdPaginatorModule,
    MdSortModule,

    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MdNativeDateModule,
    ReactiveFormsModule,
    HttpClientModule,

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,

    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'ru-RU'},
    ApiService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

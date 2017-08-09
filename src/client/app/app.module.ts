import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';

import { MaterialModule } from './material-module';
import {FlexLayoutModule} from '@angular/flex-layout';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import { ApiService } from './services/api.service';
import { commonDataTableComponent, ApiDataSource } from './common/datatable/datatable.component';
import { appRoutes } from './app.routes';
import { HomeComponent } from './home/home.component';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    commonDataTableComponent,
    TabControllerComponent,
  ],
  imports: [
    FlexLayoutModule,
    BrowserAnimationsModule,
    MaterialModule,
    BrowserModule,
    FormsModule,
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

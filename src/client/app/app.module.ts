import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Injector, LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';
import { HashLocationStrategy } from '@angular/common';

import { MaterialModule } from './material.module';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/share';

import { environment } from '../environments/environment';
import { AppRouteReuseStrategy } from './route-reuse.strategy';
import { appRoutes } from './app.routes';

import { AppComponent } from './app.component';

import { ApiService } from './services/api.service';

import { AuthService } from './auth/auth.service';
import { LoginComponent } from './auth/login-component/login-component';

import { DialogComponent } from './dialog/dialog.component';

import { DynamicFormsModule } from './UI/dynamic.froms.module';
import { TabResolver } from '../app/tab.resolver';

@NgModule({
  declarations: [
    AppComponent,
    DialogComponent,
    LoginComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    MaterialModule,
    DynamicFormsModule,

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,

    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    {
      provide: RouteReuseStrategy,
      useClass: AppRouteReuseStrategy
    },
    ApiService,
    AuthService,
    TabResolver,
  ],
  entryComponents: [
    DialogComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}

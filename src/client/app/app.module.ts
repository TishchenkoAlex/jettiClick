import 'hammerjs';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MatPaginatorIntl } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';

import { TabResolver } from '../app/tab.resolver';
import { ApiInterceptor } from './api.interceptor';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { AuthGuardService } from './auth/auth.guard.service';
import { Auth0Service } from './auth/auth0.service';
import { LoginComponent } from './auth/login-component/login-component';
import { UserSettingsService } from './auth/settings/user.settings.service';
import { LoadingService } from './common/loading.service';
import { TabControllerService } from './common/tabcontroller/tabcontroller.service';
import { JettiDateAdapter } from './jetti-date-adapter/jetti-date-adapter';
import { JETTI_DATE_FORMATS } from './jetti-date-adapter/jetti-date-formats';
import { CustomPaginator } from './jetti-date-adapter/jetti-paginator';
import { MaterialModule } from './material.module';
import { AppRouteReuseStrategy } from './route-reuse.strategy';
import { ApiService } from './services/api.service';
import { SideNavService } from './services/side-nav.service';
import { DynamicFormsModule } from './UI/dynamic.froms.module';
import { registerLocaleData } from '@angular/common';
import localeRU from '@angular/common/locales/ru';
import localeRUExtra from '@angular/common/locales/extra/ru';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    DynamicFormsModule,

    RouterModule.forRoot(appRoutes),
    JwtModule.forRoot({
      config: {
        tokenGetter: () => localStorage.getItem('access_token'),
        whitelistedDomains: ['localhost:3000', 'jetti-project.appspot.com', 'jetti-app.com']
      }
    }),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: DateAdapter, useClass: JettiDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: JETTI_DATE_FORMATS },
    {
      provide: RouteReuseStrategy,
      useClass: AppRouteReuseStrategy
    },
    { provide: MatPaginatorIntl, useClass: CustomPaginator },
    LoadingService,
    ApiService,
    Auth0Service,
    TabResolver,
    SideNavService,
    AuthGuardService,
    UserSettingsService,
    {provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true, deps: [LoadingService]}
  ],
  entryComponents: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor (private tcs: TabControllerService) {
    registerLocaleData(localeRU, localeRUExtra);
    this.tcs.menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
  }
}

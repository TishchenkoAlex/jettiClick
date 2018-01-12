import 'reflect-metadata';

import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import localeRUExtra from '@angular/common/locales/extra/ru';
import localeRU from '@angular/common/locales/ru';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, RouterModule } from '@angular/router';

import { TabResolver } from '../app/tab.resolver';
import { ApiInterceptor } from './api.interceptor';
import { AppComponent } from './app.component';
import { AppMenuComponent, AppSubMenuComponent } from './app.menu.component';
import { appRoutes } from './app.routes';
import { AppTopBarComponent } from './app.topbar.component';
import { AppProfileComponent } from './auth/app.profile.component';
import { AuthGuardService } from './auth/auth.guard.service';
import { AuthService } from './auth/auth.service';
import { UserSettingsService } from './auth/settings/user.settings.service';
import { LoadingService } from './common/loading.service';
import { MaterialModule } from './material.module';
import { PrimeNGModule } from './primeNG.module';
import { AppRouteReuseStrategy } from './route-reuse.strategy';
import { ApiService } from './services/api.service';
import { EventsService } from './services/events.service';
import { SideNavService } from './services/side-nav.service';
import { DynamicFormsModule } from './UI/dynamic.froms.module';
import { NgDragDropModule } from 'ng-drag-drop';

export function getJwtToken(): string {
  return localStorage.getItem('access_token');
}

@NgModule({
  declarations: [
    AppComponent,
    AppMenuComponent,
    AppSubMenuComponent,
    AppTopBarComponent,
    AppProfileComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    PrimeNGModule,
    DynamicFormsModule,
    NgDragDropModule.forRoot(),

    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
    ApiService,
    AuthService,
    TabResolver,
    SideNavService,
    AuthGuardService,
    UserSettingsService,
    LoadingService,
    EventsService,
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
  ],
  entryComponents: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor() {
    registerLocaleData(localeRU, localeRUExtra);
  }
}

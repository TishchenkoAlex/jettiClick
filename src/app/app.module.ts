import 'reflect-metadata';

import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import localeRUExtra from '@angular/common/locales/extra/ru';
import localeRU from '@angular/common/locales/ru';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NgDragDropModule } from 'ng-drag-drop';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { take } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { ApiInterceptor } from './api.interceptor';
import { AppComponent } from './app.component';
import { AppMenuComponent, AppSubMenuComponent } from './app.menu.component';
import { RoutingModule } from './app.routing.module';
import { AppTopBarComponent } from './app.topbar.component';
import { AppProfileComponent } from './auth/app.profile.component';
import { AuthService } from './auth/auth.service';
import { UserSettingsService } from './auth/settings/user.settings.service';
import { LoadingService } from './common/loading.service';
import { MaterialModule } from './material.module';
import { PrimeNGModule } from './primeNG.module';
import { ApiService } from './services/api.service';
import { EventsService } from './services/events.service';
import { DynamicFormsModule } from './UI/dynamic.froms.module';

export function getJwtToken(): string {
  return localStorage.getItem('access_token') || '';
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
    MonacoEditorModule.forRoot(),
    RoutingModule,
    // StoreModule.forRoot(reducers),
    // EffectsModule.forRoot([AuthEffects]),
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    ApiService,
    AuthService,
    UserSettingsService,
    LoadingService,
    EventsService,
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
  ],
  entryComponents: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(private auth: AuthService) {
    registerLocaleData(localeRU, localeRUExtra);
    auth.getAccount().pipe(take(1)).subscribe();
  }
}

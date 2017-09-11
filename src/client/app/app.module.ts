import 'hammerjs';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/toPromise';

import { HttpClientModule } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { TabResolver } from '../app/tab.resolver';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { AuthService } from './auth/auth.service';
import { LoginComponent } from './auth/login-component/login-component';
import { CustomDateAdapter } from './custom-date-adapter';
import { MaterialModule } from './material.module';
import { AppRouteReuseStrategy } from './route-reuse.strategy';
import { ApiService } from './services/api.service';
import { DynamicFormsModule } from './UI/dynamic.froms.module';

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

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,

    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    {
      provide: RouteReuseStrategy,
      useClass: AppRouteReuseStrategy
    },
    ApiService,
    AuthService,
    TabResolver,
  ],
  entryComponents: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}

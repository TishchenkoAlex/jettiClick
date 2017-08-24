import { DynamicFormsModule } from './dynamic.froms.module';
import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, LOCALE_ID } from '@angular/core';
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

import { AppRouteReuseStrategy } from './route-reuse.strategy';

import { appRoutes } from './app.routes';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import { ApiService } from './services/api.service';
import { AuthService } from './auth/auth.service';

import { LoginComponent } from './auth/login-component/login-component';
import { HomeComponent } from './home/home.component';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

import { CommonDataTableComponent, ApiDataSource } from './common/datatable/datatable.component';
import { CommonFromComponent } from './common/form/form.component';

import { DialogComponent } from './dialog/dialog.component';
import { DynamicFormControlComponent } from './common/dynamic-form/dynamic-form-control.component';
import { DynamicFormControlService } from './common/dynamic-form/dynamic-form-control.service';
import { DynamicFormService } from './common/dynamic-form/dynamic-form.service';

import { DynamicComponentDirective } from './common/dynamic-component/dynamic-component.directive';
import { DynamicComponent } from './common/dynamic-component/dynamic-component';
import { DocumentService } from './common/dynamic-component/document.service';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CommonDataTableComponent,
    CommonFromComponent,

    TabControllerComponent,
    DialogComponent,
    LoginComponent,
    DynamicFormControlComponent,
    DynamicComponentDirective,
    DynamicComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    MaterialModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,

    RouterModule.forRoot(appRoutes),

    DynamicFormsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    {
      provide: RouteReuseStrategy,
      useClass: AppRouteReuseStrategy
    },
    ApiService,
    AuthService,
    DynamicFormControlService,
    DynamicFormService,
    DocumentService
  ],
  entryComponents: [
    HomeComponent,
    CommonDataTableComponent,
    CommonFromComponent,
    DialogComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

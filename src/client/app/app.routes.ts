import { CashRegisterForm } from './UI/Catalog/CashRegister/CashRegister.form';
import { LoginComponent } from './auth/login-component/login-component';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';
import { TabResolver } from '../app/tab.resolver';

export const appRoutes: Routes = [
    // { path: 'login', component: LoginComponent },
    { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver } },
    { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver } },
    { path: '', redirectTo: 'Home', pathMatch: 'full' },
    { path: '**', redirectTo: 'Home' }
];

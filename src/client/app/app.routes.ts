import { LoginComponent } from './auth/login-component/login-component';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

export const appRoutes: Routes = [
   // { path: 'login', component: LoginComponent },
    { path: '', redirectTo: 'Home', pathMatch: 'full' },
    { path: ':id', component: TabControllerComponent},
];

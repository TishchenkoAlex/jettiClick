import { HomeComponent } from './home/home.component';
import { Routes } from '@angular/router';
import { AuthGuardService as AuthGuard } from './auth/auth.guard.service';
import { TabResolver } from '../app/tab.resolver';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

export const appRoutes: Routes = [
    { path: 'callback', redirectTo: 'Home', pathMatch: 'full' },
    { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver }, canActivate: [AuthGuard] },
    { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver }, canActivate: [AuthGuard]},
    { path: '', redirectTo: 'Home', pathMatch: 'full' },
    { path: '**', redirectTo: 'Home' }
];

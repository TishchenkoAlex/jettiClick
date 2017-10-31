import { HOME } from './common/tabcontroller/tabcontroller.service';
import { HomeComponent } from './home/home.component';
import { Routes } from '@angular/router';
import { AuthGuardService as AuthGuard } from './auth/auth.guard.service';
import { TabResolver } from '../app/tab.resolver';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

export const appRoutes: Routes = [
    { path: 'callback', redirectTo: HOME, pathMatch: 'full' },
    { path: 'access_token', redirectTo: HOME, pathMatch: 'full' },
    { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver } },
    { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver }},
    { path: '', redirectTo: HOME, pathMatch: 'full' },
    { path: '**', redirectTo: HOME }
];

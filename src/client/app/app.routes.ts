import { Routes } from '@angular/router';

import { TabResolver } from '../app/tab.resolver';
import { AuthGuardService } from './auth/auth.guard.service';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';
import { HOME } from './common/tabcontroller/tabcontroller.service';

export const appRoutes: Routes = [
    { path: 'callback', redirectTo: HOME, pathMatch: 'full' },
    { path: 'access_token', redirectTo: HOME, pathMatch: 'full' },
    { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver }, canActivate: [AuthGuardService] },
    { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver }, canActivate: [AuthGuardService] },
    { path: '', redirectTo: HOME, pathMatch: 'full' },
    { path: '**', redirectTo: HOME }
];

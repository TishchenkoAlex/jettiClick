import { Routes } from '@angular/router';

import { TabResolver } from '../app/tab.resolver';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';
import { HOME } from './common/tabcontroller/tabcontroller.service';

export const appRoutes: Routes = [
    { path: 'callback', redirectTo: HOME, pathMatch: 'full' },
    { path: 'access_token', redirectTo: HOME, pathMatch: 'full' },
    { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver } },
    { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver }},
    { path: '', redirectTo: HOME, pathMatch: 'full' },
    { path: '**', redirectTo: HOME }
];

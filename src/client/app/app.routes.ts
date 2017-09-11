import { Routes } from '@angular/router';

import { TabResolver } from '../app/tab.resolver';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

export const appRoutes: Routes = [
    // { path: 'login', component: LoginComponent },
    { path: ':type', component: TabControllerComponent, resolve: { detail: TabResolver } },
    { path: ':type/:id', component: TabControllerComponent, resolve: { detail: TabResolver } },
    { path: '', redirectTo: 'Home', pathMatch: 'full' },
    { path: '**', redirectTo: 'Home' }
];

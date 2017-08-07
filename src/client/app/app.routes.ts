import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { commonDataTableComponent } from './common/datatable/datatable.component';

export const appRoutes: Routes = [
    { path: 'Document.ClientOrder', component: commonDataTableComponent },
    { path: 'home', component: AppComponent, data: { title: 'Home'} },
    { path: '', redirectTo: '/home', pathMatch: 'full'},
];

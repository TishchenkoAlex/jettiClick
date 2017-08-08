import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { commonDataTableComponent } from './common/datatable/datatable.component';
import { HomeComponent } from './home/home.component';

export const appRoutes: Routes = [
    { path: 'Document.ClientOrder', component: commonDataTableComponent },
    { path: 'home', component: HomeComponent, data: { title: 'Home'} },
    { path: '', redirectTo: '/home', pathMatch: 'full'},
];

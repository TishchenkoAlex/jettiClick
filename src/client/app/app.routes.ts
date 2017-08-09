import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { TabControllerComponent } from './common/tabcontroller/tabcontroller.component';

export const appRoutes: Routes = [
    { path: '', component: TabControllerComponent },
    { path: ':id', component: TabControllerComponent, data: { title: 'OK'}  },
];

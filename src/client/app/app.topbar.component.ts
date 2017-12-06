import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppComponent } from './app.component';
import { LoadingService } from './common/loading.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent {
  constructor(public app: AppComponent, public lds: LoadingService) {}
}

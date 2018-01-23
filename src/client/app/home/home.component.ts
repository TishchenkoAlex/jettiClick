import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EventsService } from './../services/events.service';
import { AuthService } from '../auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent  {

  constructor(public ts: EventsService, public auth: AuthService) {}

  login(email: string, password: string) {
    this.auth.login(email, password).pipe(take(1)).subscribe(
      () => { },
      console.error
    );
  }
}

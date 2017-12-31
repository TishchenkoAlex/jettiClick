import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EventsService } from './../services/events.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent  {

  constructor(public ts: EventsService) {}

}

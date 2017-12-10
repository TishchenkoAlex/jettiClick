import { AppComponent } from '../app.component';
import { TabControllerService } from '../common/tabcontroller/tabcontroller.service';
import { Component, Input } from '@angular/core';

interface PBData { accessToken: string, embedUrl: string, type: string, id: string }

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  @Input() show = true;
}

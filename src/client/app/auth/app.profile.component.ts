import { animate, Component, state, style, transition, trigger, Input } from '@angular/core';
import { Auth0Service } from './../auth/auth0.service';

@Component({
  selector: 'app-inline-profile',
  templateUrl: './app.profile.component.html',
  animations: [
    trigger('menu', [
      state('hidden', style({
        height: '0px'
      })),
      state('visible', style({
        height: '*'
      })),
      transition('visible => hidden', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
      transition('hidden => visible', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
    ])
  ]
})
export class AppProfileComponent {

  active: boolean;
  @Input() inline = true;

  constructor(public appAuth: Auth0Service) { }

  onClick(event) {
    this.active = !this.active;
    event.preventDefault();
  }
}

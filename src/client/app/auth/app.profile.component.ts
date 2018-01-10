import { animate, Component, Input, state, style, transition, trigger } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { take } from 'rxjs/operators/take';

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

  constructor(public appAuth: AuthService) { }

  onClick(event) {
    this.active = !this.active;
    event.preventDefault();
  }

  login() {
    this.appAuth.login('tischenko.a@gmail.com', 'Pa$$word').pipe(take(1)).subscribe(
      () => { },
      console.error
    );
  }
}

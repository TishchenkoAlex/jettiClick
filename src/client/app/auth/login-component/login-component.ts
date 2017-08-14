import { AuthService } from './../auth.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login-component.html'
})
export class LoginComponent {

  constructor(public appAuth: AuthService  ) {
  }

}


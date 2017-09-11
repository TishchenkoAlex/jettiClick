import { Component } from '@angular/core';

import { AuthService } from './../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login-component.html'
})
export class LoginComponent {

  constructor(public appAuth: AuthService  ) {
  }

}


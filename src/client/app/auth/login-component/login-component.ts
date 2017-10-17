import { Component } from '@angular/core';

import { Auth0Service } from '../auth0.service';

@Component({
  selector: 'app-login',
  templateUrl: './login-component.html'
})
export class LoginComponent {

  constructor(public appAuth: Auth0Service) { }
}


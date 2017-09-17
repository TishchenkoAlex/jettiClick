import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { AccountRegister } from './../../models/account.register';

@Component({
  selector: 'j-register-movement',
  styleUrls: ['./register-movement.component.scss'],
  templateUrl: './register-movement.component.html',
})
export class RegisterMovementComponent implements OnInit, OnDestroy {

  movements$: Observable<AccountRegister[]>;
  @Input() docID: string;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.movements$ = this.apiService.getDocAccountMovementsView(this.docID).take(1);
  }

  ngOnDestroy() {

  }
}

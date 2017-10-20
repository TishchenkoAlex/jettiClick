import { AfterViewInit, Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocModel } from '../doc.model';
import { DocService } from '../doc.service';
import { AccountRegister } from './../../models/account.register';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-movement',
  styleUrls: ['./register-movement.component.scss'],
  templateUrl: './register-movement.component.html',
})
export class RegisterMovementComponent implements OnInit, AfterViewInit {

  movements$: Observable<AccountRegister[]>;
  @Input() doc: DocModel;

  constructor(private apiService: ApiService, private docService: DocService) { }

  ngOnInit() {

    this.movements$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$,
      this.docService.do$]
    ).filter(doc => doc.id === this.doc.id)
      .switchMap(doc => this.apiService.getDocAccountMovementsView(this.doc.id));
  }

  ngAfterViewInit() {
    this.docService.do(this.doc);
  }

}

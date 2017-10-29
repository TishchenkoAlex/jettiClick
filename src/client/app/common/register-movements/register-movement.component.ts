import { DocModel } from '../../../../server/modules/doc.base';
import { AccountRegister } from '../../../../server/models/account.register';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-movement',
  styleUrls: ['./register-movement.component.scss'],
  templateUrl: './register-movement.component.html',
})
export class RegisterMovementComponent implements OnInit {

  movements$: Observable<AccountRegister[]>;
  @Input() doc: DocModel;

  constructor(private apiService: ApiService, private docService: DocService) { }

  ngOnInit() {

    this.movements$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$,
      this.docService.do$]
    ).startWith(this.doc)
      .filter(doc => doc.id === this.doc.id)
      .switchMap(doc => this.apiService.getDocAccountMovementsView(this.doc.id));
  }
}

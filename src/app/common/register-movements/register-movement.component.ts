import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { merge } from 'rxjs/observable/merge';
import { filter, startWith, switchMap } from 'rxjs/operators';

import { AccountRegister } from '../../../../server/models/account.register';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { DocumentBase } from './../../../../server/models/document';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-movement',
  styleUrls: ['./register-movement.component.scss'],
  templateUrl: './register-movement.component.html',
})
export class RegisterMovementComponent implements OnInit {

  movements$: Observable<AccountRegister[]>;
  selection: any;
  @Input() doc: DocumentBase;

  constructor(private api: ApiService, private ds: DocService) { }

  ngOnInit() {
    this.movements$ = merge(...[
      this.ds.save$,
      this.ds.delete$,
      this.ds.do$]
    ).pipe(startWith(this.doc),
      filter(doc => doc.id === this.doc.id),
      switchMap(doc => this.api.getDocAccountMovementsView(this.doc.id)));
  }
}

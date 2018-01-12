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
  @Input() doc: DocumentBase;

  constructor(private apiService: ApiService, private docService: DocService) { }

  ngOnInit() {
    this.movements$ = merge(...[
      this.docService.save$,
      this.docService.delete$,
      this.docService.do$]
    ).pipe(startWith(this.doc),
      filter(doc => doc.id === this.doc.id),
      switchMap(doc => this.apiService.getDocAccountMovementsView(this.doc.id)));
  }
}

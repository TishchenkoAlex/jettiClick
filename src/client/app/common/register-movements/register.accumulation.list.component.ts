import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocModel } from '../doc.model';
import { DocService } from '../doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-accumulation-list',
  styleUrls: ['./register.accumulation.list.component.scss'],
  templateUrl: './register.accumulation.list.component.html',
})
export class RegisterAccumulationListComponent implements OnInit {

  list$: Observable<any[]>;
  @Input() doc: DocModel;

  constructor(private apiService: ApiService, private docService: DocService) { }

  ngOnInit() {

    this.list$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$,
      this.docService.do$]
    ).startWith(this.doc)
    .filter(doc => doc.id === this.doc.id)
      .switchMap(doc => this.apiService.getDocRegisterAccumulationList(this.doc.id));
  }
}

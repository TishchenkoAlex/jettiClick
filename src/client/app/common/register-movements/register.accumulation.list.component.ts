import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { filter, startWith, switchMap } from 'rxjs/operators';

import { DocModel } from '../../../../server/modules/doc.base';
import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-accumulation-list',
  templateUrl: './register.accumulation.list.component.html',
})
export class RegisterAccumulationListComponent implements OnInit {

  accumulationList$: Observable<any[]>;
  infoList$: Observable<any[]>;
  @Input() doc: DocModel;

  constructor(private apiService: ApiService, private docService: DocService) { }

  ngOnInit() {

    this.accumulationList$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$,
      this.docService.do$]
    ).pipe(
      startWith(this.doc),
      filter(doc => doc.id === this.doc.id),
      switchMap(doc => this.apiService.getDocRegisterAccumulationList(this.doc.id)));

    this.infoList$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$,
      this.docService.do$]
    ).pipe(
      startWith(this.doc),
      filter(doc => doc.id === this.doc.id),
      switchMap(doc => this.apiService.getDocRegisterInfoList(this.doc.id)));
  }
}

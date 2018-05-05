import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
// tslint:disable-next-line:import-blacklist
import { Observable, merge } from 'rxjs';
import { filter, startWith, switchMap } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { DocumentBase } from './../../../../server/models/document';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-accumulation-list',
  templateUrl: './register.accumulation.list.component.html',
})
export class RegisterAccumulationListComponent implements OnInit {

  accumulationList$: Observable<any[]>;
  infoList$: Observable<any[]>;
  @Input() doc: DocumentBase;

  constructor(private api: ApiService, private ds: DocService) { }

  ngOnInit() {

    this.accumulationList$ = merge(...[
      this.ds.save$,
      this.ds.delete$,
      this.ds.do$]
    ).pipe(
      startWith(this.doc),
      filter(doc => doc.id === this.doc.id),
      switchMap(doc => this.api.getDocRegisterAccumulationList(this.doc.id)));

    this.infoList$ = merge(...[
      this.ds.save$,
      this.ds.delete$,
      this.ds.do$]
    ).pipe(
      startWith(this.doc),
      filter(doc => doc.id === this.doc.id),
      switchMap(doc => this.api.getDocRegisterInfoList(this.doc.id)));
  }
}

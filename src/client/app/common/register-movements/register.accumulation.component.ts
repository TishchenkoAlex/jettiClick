import { DocModel } from '../../../../server/modules/doc.base';
import { DataSource } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { tap } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-accumulation',
  styleUrls: ['./register.accumulation.component.scss'],
  templateUrl: './register.accumulation.component.html',
})
export class RegisterAccumulationComponent implements OnInit {

  movements: MovementsDataSource;
  @Input() doc: DocModel;
  @Input() register: string;

  constructor(private apiService: ApiService, private docService: DocService) { }

  ngOnInit() {
    this.movements = new MovementsDataSource(this.apiService, this.register, this.doc.id);
  }
}

export class MovementsDataSource extends DataSource<any> {

  displayedColumns: any[] = ['kind', 'date', 'company'];
  additionalColumns: any[] = [];

  constructor(private apiService: ApiService, private register, private id) {
    super();
  }

  connect(): Observable<any[]> {
    return this.apiService.getDocAccumulationMovements(this.register, this.id).pipe(
      tap(data => {
        if (data.length > 0) {
          this.additionalColumns = Object.keys(data[0])
            .filter(el => ['date', 'kind', 'company', 'document']
              .findIndex(e => e === el) === -1);
          this.displayedColumns = [...this.displayedColumns, ...this.additionalColumns];
        }
      }))
  }

  disconnect(): void { }
}

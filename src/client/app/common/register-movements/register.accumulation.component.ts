import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { DocService } from '../doc.service';
import { DocumentBase } from './../../../../server/models/document';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-register-accumulation',
  templateUrl: './register.accumulation.component.html',
})
export class RegisterAccumulationComponent implements OnInit {

  @Input() register: string;
  @Input() doc: DocumentBase;
  movements: DocumentBase[] = [];
  displayedColumns: any[] = [];
  additionalColumns: any[] = [];

  constructor(private apiService: ApiService, private docService: DocService, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.apiService.getDocAccumulationMovements(this.register, this.doc.id).pipe(take(1))
      .subscribe(data => {
        this.movements = data;
        this.additionalColumns =
          Object.keys(data[0]).filter(el => ['date', 'kind', 'company', 'document'].findIndex(e => e === el) === -1);
        this.displayedColumns = [...this.displayedColumns, ...this.additionalColumns];
        this.cd.markForCheck();
      }
    );
  }
}

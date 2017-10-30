import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';

import { ColumnDef } from '../../../../server/models/column';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-filter',
  styleUrls: ['./filter.component.scss'],
  templateUrl: './filter.component.html',
})
export class FilterFormComponent  {

  @Input() docType = '';
  @Input() columns: ColumnDef[];

  constructor(private cd: ChangeDetectorRef) {}

}

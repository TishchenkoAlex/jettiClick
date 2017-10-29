import { ConnectedOverlayPositionChange, ConnectedPositionStrategy, OverlayOrigin } from '@angular/cdk/overlay';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MatInput } from '@angular/material';

import { ColumnDef } from '../../../../server/models/column';
import { UserSettingsService } from '../../auth/settings/user.settings.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'filter-column',
  templateUrl: './fiter-column.component.html'
})
export class FilterColumnComponent implements AfterViewInit {

  private _positionStrategy: ConnectedPositionStrategy;

  @Input() field: ColumnDef;
  @Input() type = '';
  @ViewChild(MatInput) filter: MatInput;
  @ViewChild(OverlayOrigin) _overlayOrigin: OverlayOrigin;
  firstValue;
  secondValue;
  isOpen = false;

  constructor(private cd: ChangeDetectorRef, private uss: UserSettingsService) { }

  ngAfterViewInit() {
    if (this.field.filter.right === null) { return }
    this.firstValue = this.field.filter.right.toString();
    this.cd.detectChanges();
  }

  attach() {
    Promise.resolve().then(() => this.filter.focus());
  }

  detach() {
    if (this.isOpen) { this.isOpen = false };
    this.cd.markForCheck();
  }

  backdropClick() {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  positionChange(event: ConnectedOverlayPositionChange) {
    this.cd.detectChanges();
  }

  onFilter() {
    this.isOpen = false;
    this.field.filter.right = this.firstValue;
  }
}

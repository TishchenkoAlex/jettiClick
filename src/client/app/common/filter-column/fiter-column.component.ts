import { FilterInterval } from '../../../../server/models/user.settings';
import { DynamicFilterControlComponent } from './dynamic-filter-control.component';
import { ConnectedOverlayPositionChange, ConnectedPositionStrategy, OverlayOrigin, ConnectionPositionPair } from '@angular/cdk/overlay';
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

  @Input() columnDef: ColumnDef;
  @Input() type = '';
  @ViewChild(DynamicFilterControlComponent) filter: DynamicFilterControlComponent;
  @ViewChild(OverlayOrigin) _overlayOrigin: OverlayOrigin;
  isOpen = false;
  backup: ColumnDef;

  constructor(private cd: ChangeDetectorRef, private uss: UserSettingsService) { }

  ngAfterViewInit() {
    this.backup = JSON.parse(JSON.stringify(this.columnDef));
    if (this.columnDef.filter.right === null) { return }
    this.cd.detectChanges();
  }

  attach() {
    Promise.resolve().then(() => this.filter.focus());
  }

  detach() {
    if (this.isOpen) { this.onCancel() };
  }

  onCancel() {
    this.columnDef = JSON.parse(JSON.stringify(this.backup));
    this.isOpen = false;
    this.cd.markForCheck();
  }

  backdropClick() {
    this.detach();
  }

  positionChange(event: ConnectedOverlayPositionChange) {
    console.log(event.connectionPair);
    // event.connectionPair.overlayX = 'end';
    // event.connectionPair = new ConnectionPositionPair({originX: 'start', originY: 'bottom'}, {overlayX: 'end', overlayY: 'top'});
    // console.log(event.connectionPair);
    // this.cd.markForCheck();
    // this.cd.detectChanges();
  }

  onFilter() {
    this.isOpen = false;
    this.uss.setFormListSettings(this.type, this.uss.userSettings.formListSettings[this.type]);
  }

  onClear() {
    this.columnDef = {...this.columnDef, filter: {...this.columnDef.filter, right: null} };
    this.filter.filterInterval = new FilterInterval();
  }

  get isFilter()  {
    if (this.columnDef.filter.right && typeof this.columnDef.filter.right !== 'object') { return true }
    if (this.columnDef.filter.right && this.columnDef.filter.right['value']) { return true }
    if (this.columnDef.filter.right && this.columnDef.filter.right['start']) { return true }
    if (this.columnDef.filter.right && this.columnDef.filter.right['end']) { return true }
    return false;
  }

}

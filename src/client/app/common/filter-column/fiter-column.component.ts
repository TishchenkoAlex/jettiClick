import { ConnectedOverlayPositionChange, ConnectedPositionStrategy, OverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { UserSettingsService } from '../../auth/settings/user.settings.service';
import { DynamicFilterControlComponent } from './dynamic-filter-control.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'filter-column',
  templateUrl: './fiter-column.component.html'
})
export class FilterColumnComponent {

  private _positionStrategy: ConnectedPositionStrategy;
  private _ColumnDefChanges$: Subscription = Subscription.EMPTY;

  @Input() columnDef: ColumnDef;
  @Input() type = '';
  @ViewChild(DynamicFilterControlComponent) filter: DynamicFilterControlComponent;
  @ViewChild(OverlayOrigin) _overlayOrigin: OverlayOrigin;

  isOpen = false;
  private backup: ColumnDef;

  constructor(private cd: ChangeDetectorRef, private uss: UserSettingsService) { }

  attach() {
    Promise.resolve().then(() => this.filter.focus());
    this.backup = JSON.parse(JSON.stringify(this.columnDef));
  }

  detach() {
    if (this.isOpen) { this.onCancel() };
  }

  onCancel() {
    this.columnDef = this.backup;
    this.isOpen = false;
    this.cd.markForCheck();
  }

  backdropClick() {
    this.detach();
  }

  positionChange(event: ConnectedOverlayPositionChange) {
    // event.connectionPair.overlayX = 'end';
    // event.connectionPair = new ConnectionPositionPair({originX: 'start', originY: 'bottom'}, {overlayX: 'end', overlayY: 'top'});
    // console.log(event.connectionPair);
    // this.cd.markForCheck();
    // this.cd.detectChanges();
  }

  onFilter() {
    const i = this.uss.userSettings.formListSettings[this.type].filter.findIndex(el => el.left === this.columnDef.filter.left);
    if (i > -1) { this.uss.userSettings.formListSettings[this.type].filter[i] = this.columnDef.filter }
    this.isOpen = false;
    this.uss.setFormListSettings(this.type, this.uss.userSettings.formListSettings[this.type]);
  }

  onChange() {
    this.cd.markForCheck();
  }

  get isFilter() {
    if (this.columnDef.filter.right) {
      if (typeof this.columnDef.filter.right !== 'object') { return true }
      if (this.columnDef.filter.right['value']) { return true }
      if (this.columnDef.filter.right['start']) { return true }
      if (this.columnDef.filter.right['end']) { return true }
    }
    return false;
  }

}

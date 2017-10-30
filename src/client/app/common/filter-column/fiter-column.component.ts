import { ConnectedOverlayPositionChange, ConnectedPositionStrategy, OverlayOrigin } from '@angular/cdk/overlay';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    ViewChild,
} from '@angular/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ColumnDef } from '../../../../server/models/column';
import { FilterInterval } from '../../../../server/models/user.settings';
import { UserSettingsService } from '../../auth/settings/user.settings.service';
import { DynamicFilterControlComponent } from './dynamic-filter-control.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'filter-column',
  templateUrl: './fiter-column.component.html'
})
export class FilterColumnComponent implements AfterViewInit, OnDestroy {

  private _positionStrategy: ConnectedPositionStrategy;
  private _ColumnDefChanges$: Subscription = Subscription.EMPTY;

  @Input() columnDef: ColumnDef;
  @Input() type = '';
  @ViewChild(DynamicFilterControlComponent) filter: DynamicFilterControlComponent;
  @ViewChild(OverlayOrigin) _overlayOrigin: OverlayOrigin;
  isOpen = false;
  backup: ColumnDef;

  constructor(private cd: ChangeDetectorRef, private uss: UserSettingsService) { }

  ngAfterViewInit() {
    this._ColumnDefChanges$ = this.uss.columnDef$.pipe(
      filter(c => c.field === this.columnDef.field && c.type === this.type)
    ).subscribe(c => {
      this.columnDef = c;
      this.cd.detectChanges();
    });

    if (this.columnDef.filter.right === null) { return }
  }

  ngOnDestroy() {
    this._ColumnDefChanges$.unsubscribe();
  }

  attach() {
    this.backup = JSON.parse(JSON.stringify(this.columnDef));
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
    this.columnDef = { ...this.columnDef, filter: { ...this.columnDef.filter, right: null } };
    this.filter.filterInterval = new FilterInterval();
    this.uss.columnDef$.next(JSON.parse(JSON.stringify(this.columnDef)));
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

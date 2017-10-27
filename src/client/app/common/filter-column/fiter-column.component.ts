import { ConnectedOverlayPositionChange, ConnectedPositionStrategy, OverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MatInput } from '@angular/material';

import { ColDef } from './column';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'filter-column',
  templateUrl: './fiter-column.component.html'
})
export class FilterColumnComponent {

  private _positionStrategy: ConnectedPositionStrategy;

  @Input() field: ColDef;
  @ViewChild(MatInput) filter: MatInput;
  @ViewChild(OverlayOrigin) _overlayOrigin: OverlayOrigin;

  isOpen = false;

  constructor(private cd: ChangeDetectorRef) { }

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
    console.log('positionChange', event);
  }
}

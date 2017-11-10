import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { BaseFormComponent } from '../../../common/form/base.form.components/base.form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'CashRegister.form.html',
})
export class CashRegisterFormComponent {
  @ViewChild(BaseFormComponent) super: BaseFormComponent;
  get viewModel() { return this.super.viewModel }
}

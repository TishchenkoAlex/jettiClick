import { Component } from '@angular/core';
import { BaseFormComponent } from './../../common/form/form.base.components/form.base.component';

@Component({
  templateUrl: './form.component.html',
})
export class CommonFormComponent extends BaseFormComponent {

  Save() {
    console.log('Master SAVE');
    super.Save()
  }
}

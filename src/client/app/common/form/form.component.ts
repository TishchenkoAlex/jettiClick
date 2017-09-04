import { Component } from '@angular/core';
import { DocumentService } from '../dynamic-component/document.service';
import { BaseFormComponent } from './../../common/form/form.base.components/form.base.component';

@Component({
  templateUrl: './form.component.html',
  providers: [
    DocumentService,
  ]
})
export class CommonFormComponent extends BaseFormComponent {

}

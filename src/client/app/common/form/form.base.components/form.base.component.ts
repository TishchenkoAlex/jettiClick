import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { DocModel } from '../../doc.model';
import { DocService } from '../../../common/doc.service';
import { DocumentComponent } from '../../../common/dynamic-component/dynamic-component';
import { ViewModel } from '../../dynamic-form/dynamic-form.service';
import { SideNavService } from './../../../services/side-nav.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'j-form',
  styleUrls: ['./form.base.component.scss'],
  templateUrl: './form.base.component.html',
})
export class BaseFormComponent implements DocumentComponent, OnInit, OnDestroy {

  private _subscription$: Subscription = Subscription.EMPTY;

  @Input() data;
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  viewModel: ViewModel;

  constructor(private route: ActivatedRoute, private docService: DocService,
    private sideNavService: SideNavService) { }

  ngOnInit() {
    this.sideNavService.templateRef = this.sideNavTepmlate;
    this.viewModel = this.route.data['value'].detail;

    this._subscription$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$])
      .filter(doc => doc.id === this.viewModel.model.id)
      .subscribe(savedDoc => {
        this.viewModel.model = savedDoc;
        this.viewModel.formGroup.patchValue(savedDoc, {onlySelf: true, emitEvent: false});
      });
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
  }

  Save() {
    console.log('BASE SAVE');
    this.onSubmit();
  }

  PostClose() {
    this.Post();
    this.Close()
  }

  Post() {
    this.viewModel.model.posted = true;
    this.onSubmit();
  }

  unPost() {
    this.viewModel.model.posted = false;
    this.onSubmit();
  }

  Delete() {
    this.docService.delete(this.viewModel.model.id);
  }

  Close() {
    console.log('BASE CLOSE');
    this.docService.close(this.viewModel.model);
  }

  onSubmit() {
    const formDoc = this.viewModel.formGroup.getRawValue();
    const newDoc = this.docService.createNewDoc(this.viewModel.model, formDoc);
    this.docService.save(newDoc);
  }

}

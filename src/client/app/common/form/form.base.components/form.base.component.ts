import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { DocModel } from '../../../common/_doc.model';
import { DocService } from '../../../common/doc.service';
import { DocumentComponent } from '../../../common/dynamic-component/dynamic-component';
import { ViewModel } from '../../dynamic-form/dynamic-form.service';

@Component({
  selector: 'j-form',
  templateUrl: './form.base.component.html',
})
export class BaseFormComponent implements DocumentComponent, OnInit, OnDestroy {

  private _delete$: Subscription = Subscription.EMPTY;
  private _save$: Subscription = Subscription.EMPTY;

  @Input() data;
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;

  viewModel: ViewModel;

  constructor(private route: ActivatedRoute, private ds: DocService) { }

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;

    this._save$ = this.ds.save$
    .filter(doc => doc.id === this.viewModel.model.id)
    .subscribe((savedDoc: DocModel) => {
      this.viewModel.model = savedDoc;
      this.viewModel.formGroup.patchValue(savedDoc);
    });

    this._delete$ = this.ds.delete$
    .filter(doc => doc.id === this.viewModel.model.id)
    .subscribe((deletedDoc: DocModel) => {
      this.viewModel.model = deletedDoc;
      this.viewModel.formGroup.patchValue(deletedDoc);
    });

  }

  ngOnDestroy() {
    this._delete$.unsubscribe();
    this._save$.unsubscribe();
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
    this.ds.delete(this.viewModel.model.id);
  }

  Close() {
    console.log('BASE CLOSE');
    this.ds.close(this.viewModel.model);
  }

  onSubmit() {
    const formDoc = this.viewModel.formGroup.getRawValue();
    const newDoc = this.ds.createNewDoc(this.viewModel.model, formDoc);
    this.ds.save(newDoc);
  }

}

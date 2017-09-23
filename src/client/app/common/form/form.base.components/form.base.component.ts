import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../../common/doc.service';
import { DocumentComponent } from '../../../common/dynamic-component/dynamic-component';
import { ViewModel } from '../../dynamic-form/dynamic-form.service';
import { SideNavService } from './../../../services/side-nav.service';

@Component({
  selector: 'j-form',
  styleUrls: ['./form.base.component.scss'],
  templateUrl: './form.base.component.html',
})
export class BaseFormComponent implements DocumentComponent, OnInit, OnDestroy {
  @Input() data;
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  viewModel: ViewModel;
  isDoc: boolean;

  private _subscription$: Subscription = Subscription.EMPTY;

  constructor(private router: Router,  private route: ActivatedRoute,
    private docService: DocService, private sideNavService: SideNavService) {}

  ngOnInit() {
    this.viewModel = this.route.data['value'].detail;
    this.isDoc = this.viewModel.model.type.startsWith('Document.')
    this.sideNavService.templateRef = this.sideNavTepmlate;

    this._subscription$ = Observable.merge(...[
      this.docService.save$,
      this.docService.delete$])
      .filter(doc => doc.id === this.viewModel.model.id)
      .subscribe(savedDoc => {
        this.viewModel.model = savedDoc;
        this.viewModel.formGroup.patchValue(savedDoc, { emitEvent: false });
      });
  }

  ngOnDestroy() {
    console.log('DESTROY', this.data);
    this._subscription$.unsubscribe();
  }

  private onSubmit() {
    this.viewModel.model = Object.assign(this.viewModel.model, this.viewModel.formGroup.value);
    this.docService.save(this.viewModel.model);
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

  Copy() {
    console.log('BASE COPY');
    this.router.navigate([this.viewModel.model.type, 'copy-' + this.viewModel.model.id]);
  }

}

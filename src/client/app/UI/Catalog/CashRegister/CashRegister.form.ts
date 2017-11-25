import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../../common/doc.service';
import { ViewModel } from '../../../common/dynamic-form/dynamic-form.service';
import { SideNavService } from './../../../services/side-nav.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './CashRegister.form.html'
})
export class CashRegisterFormComponent implements OnInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;

  viewModel: ViewModel = this.route.data['value'].detail;
  docId = this.route.params['value'].id;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;
  protected _sideNavService$: Subscription = Subscription.EMPTY;

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table') }

  constructor(public router: Router, public route: ActivatedRoute,
    public ds: DocService, public sideNavService: SideNavService, private location: Location) { }

  ngOnInit() {
    this.sideNavService.templateRef = this.sideNavTepmlate;
    console.log(this.viewModel.view);
    this._subscription$ = Observable.merge(...[
      this.ds.save$,
      this.ds.delete$]).pipe(
      filter(doc => doc.id === this.docId))
      .subscribe(savedDoc => {
        this.viewModel.model = savedDoc;
        this.viewModel.formGroup.patchValue(savedDoc, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
      });

      this._saveCloseSubscription$ = this.ds.saveCloseDoc$.pipe(
      filter(doc => doc.id === this.viewModel.model.id))
      .subscribe(savedDoc => {
        this.viewModel.model = savedDoc;
        this.viewModel.formGroup.patchValue(savedDoc, { emitEvent: false });
        this.viewModel.formGroup.markAsPristine();
        this.Goto();
        this.Close();
      });

    this._sideNavService$ = this.sideNavService.do$.pipe(
      filter(data => data.type === this.viewModel.model.type && data.id === this.docId))
      .subscribe(data => this.sideNavService.templateRef = this.sideNavTepmlate);

    this._closeSubscription$ = this.ds.close$.pipe(
      filter(data => data && data.type === this.viewModel.model.type && data.id === this.docId))
      .subscribe(data => this.Close())
  }

  ngOnDestroy() {
    this._subscription$.unsubscribe();
    this._sideNavService$.unsubscribe();
    this._saveCloseSubscription$.unsubscribe();
    this._closeSubscription$.unsubscribe();
  }

  private onSubmit(close = false) {
    this.viewModel.model = Object.assign(this.viewModel.model, this.viewModel.formGroup.getRawValue()); // ???
    this.ds.save(this.viewModel.model, close);
  }

  Save(close = false) {
    this.onSubmit(close);
  }

  Post() {
    this.viewModel.model.posted = true;
    this.Save();
  }

  PostClose() {
    this.viewModel.model.posted = true;
    this.Save(true);
  }

  unPost() {
    this.viewModel.model.posted = false;
    this.Save();
  }

  Delete() {
    this.ds.delete(this.viewModel.model.id);
  }

  Close() {
    if (this.viewModel.formGroup.pristine) {
      this.ds.close(null);
      this.location.back();
    } else {
      if (confirm('Discard changes and close?')) {
        this.ds.close(null);
        this.location.back();
      }
    }
  }

  Copy() {
    this.router.navigate([this.viewModel.model.type, 'copy-' + this.viewModel.model.id]);
  }

  Goto() {
    this.router.navigate([this.viewModel.model.type]).then(() => {
      setTimeout(() => this.ds.goto(this.viewModel.model));
    });
  }

}

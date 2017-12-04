import { Location } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/components/common/messageservice';
import { Calendar } from 'primeng/primeng';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { DocService } from '../../common/doc.service';
import { ViewModel } from '../../common/dynamic-form/dynamic-form.service';
import { DynamicFormControlComponent } from './../../common/dynamic-form/dynamic-form-control.component';
import { SideNavService } from './../../services/side-nav.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'j-form',
  templateUrl: './base.form.component.html'
})
export class BaseFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() formTepmlate: TemplateRef<any>;
  @Input() actionTepmlate: TemplateRef<any>;
  @ViewChild('sideNavTepmlate') sideNavTepmlate: TemplateRef<any>;
  @ViewChildren(DynamicFormControlComponent) input: QueryList<DynamicFormControlComponent>;

  viewModel: ViewModel = this.route.data['value'].detail;
  docId = this.route.params['value'].id;

  private _subscription$: Subscription = Subscription.EMPTY;
  private _closeSubscription$: Subscription = Subscription.EMPTY;
  private _saveCloseSubscription$: Subscription = Subscription.EMPTY;
  protected _sideNavService$: Subscription = Subscription.EMPTY;

  get hasTables() { return this.viewModel.view.find(t => t.type === 'table') }

  constructor(public router: Router, public route: ActivatedRoute, private messageService: MessageService,
    private location: Location, public cd: ChangeDetectorRef, public ds: DocService, public sideNavService: SideNavService) {
  }

  /*
  @HostListener('keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.keyCode === 27) { this.Close() }
  }
 */

 ngOnInit() {
    this.sideNavService.templateRef = this.sideNavTepmlate;
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

  private _focus() {
    const arr = this.input.toArray();
    // try focus date
    const date = arr.find(el => el.control.key === 'date');
    if (date && date.input) { (date.input as Calendar).inputfieldViewChild.nativeElement.focus(); return }

    // try focus description
    const description = arr.find(el => el.control.key === 'description').input;
    if (description) { description.nativeElement.focus() }
  }

  ngAfterViewInit() {
    this._focus();
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

  private _close() { ; this.cd.markForCheck(); this.location.back(); this.ds.close(null) };

  Close() {
    if (this.viewModel.formGroup.pristine) { this._close(); return }
    this._focus()
    this.ds.confirmationService.confirm({
      message: 'Discard changes and close?',
      header: 'Confirmation',
      icon: 'fa fa-question-circle',
      accept: this._close.bind(this),
      reject: () => { this._focus(); this.cd.markForCheck() }
    })
  }

  Copy() {
    this.router.navigate([this.viewModel.model.type, 'copy-' + this.viewModel.model.id]);
  }

  Goto() {
    this.router.navigate([this.viewModel.model.type]).then(() => {
      setTimeout(() => this.ds.goto(this.viewModel.model));
    });
  }

  Print() {
    // tslint:disable-next-line:max-line-length
    // const strWindowFeatures = 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,directories=no,titlebar=no,width=1024,height=720,top=150,left=200';
    // tslint:disable-next-line:max-line-length
    const strWindowFeatures = '';
    // tslint:disable-next-line:max-line-length
    window.open(`https://pharm.yuralex.com/ReportServer/Pages/ReportViewer.aspx?%2fReport+Project1%2fReport1&rs:Command=Render&invoiceID=${this.docId}`, 'Print', strWindowFeatures);
  }

}

import { Injectable, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SideNavService {

  protected _do = new Subject<any>();
  do$ = this._do.asObservable();

  public templateRef: TemplateRef<any>;

  constructor() { }

  do(data) {
    this.templateRef = undefined;
    this._do.next(data);
  }
}

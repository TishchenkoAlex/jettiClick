import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class LoadingService {

  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  private _color = new BehaviorSubject<'primary' | 'accent' | 'warn'>('accent');
  color$ = this._color.asObservable();

  set loading(value: boolean) {
    if (value !== this._loading.value) {
      Promise.resolve().then(() => this._loading.next(value));
    }
  }

  get loading() { return this._loading.value }

  set color(value) {
    if (value !== this._color.value) {
      Promise.resolve().then(() => this._color.next(value));
    }
  }

  get color() { return this._color.value }

}

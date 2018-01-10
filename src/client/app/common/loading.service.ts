import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class LoadingService {

  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  private _counter = new BehaviorSubject<number>(undefined);
  counter$ = this._counter.asObservable();

  private _color = new BehaviorSubject<'primary' | 'accent' | 'warn'>('accent');
  color$ = this._color.asObservable();

  set loading(value: boolean) {
    if (value !== this._loading.value) {
      this._loading.next(value);
    }
  }
  get loading() { return this._loading.value; }

  set color(value) {
    this._color.next(value);
    if (value !== this._color.value) {
      this._color.next(value);
    }
  }
  get color() { return this._color.value; }

  set counter(value) {
    this._counter.next(value);
    if (value !== this._counter.value) {
      this._counter.next(value);
    }
  }
  get counter() { return this._counter.value; }

}

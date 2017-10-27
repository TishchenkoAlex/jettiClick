import { AccountRegister } from '../../../server/models/account.register';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { FormListSettings } from '../../../server/models/user.settings';
import { environment } from '../../environments/environment';
import { DocModel } from '../common/doc.model';
import { mapDocToApiFormat } from '../common/mapping/document.mapping';

export interface DocListResponse { data: any[], total_count: number };

export interface DocListRequest {
  id: string, type: string, command: string, count: number, offset: number,
  orderStr: string,
  filterObject: any
}
export interface Continuation { first: DocModel, last: DocModel }
export interface DocListResponse2 { data: any[], continuation: Continuation };

@Injectable()
export class ApiService {

  private url = environment.api;

  constructor(private http: HttpClient) { }

  getDocList(type: string, id: string, command: string, count = 10, offset = 0, order = '', filter = {}): Observable<DocListResponse2> {
    const query = `${this.url}list`;
    const body: DocListRequest = {
      id: id, type: type, command: command, count: count, offset: offset,
      orderStr: order,
      filterObject: filter
    }
    return (this.http.post(query, body) as Observable<DocListResponse2>)
      .catch(err => Observable.of({ data: [], continuation: null }))
  }

  getView(type: string): Observable<Object> {
    const query = `${this.url}${type}/view/`;
    return (this.http.get(query))
      .map(data => data['view'])
      .catch(err => Observable.of({}))
  }

  getViewModel(type: string, id = ''): Observable<Object> {
    if (id === 'new') { id = ''; }
    const query = `${this.url}${type}/view/${id}`;
    return (this.http.get(query))
      .catch(err => Observable.of({}))
  }

  getSuggests(docType: string, filter = ''): Observable<any[]> {
    const query = `${this.url}suggest/${docType}/${filter}`;
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => Observable.of([]))
  }

  getSuggestsById(id: string): Observable<Object> {
    const query = `${this.url}suggest/${id}`;
    return (this.http.get(query))
      .catch(err => Observable.of({}))
  }

  postDoc(doc: DocModel) {
    const apiDoc = mapDocToApiFormat(doc);
    const query = `${this.url}`;
    return (this.http.post(query, apiDoc) as Observable<DocModel>)
      .catch((err: HttpErrorResponse) => Observable.of(err))
  }

  postDocById(id: string): Observable<boolean> {
    const query = `${this.url}post/${id}`;
    return (this.http.get(query) as Observable<boolean>)
      .catch(err => Observable.of(false))
  }

  deleteDoc(id: string): Observable<Object> {
    const query = `${this.url}${id}`;
    return (this.http.delete(query))
      .catch(err => Observable.of(null))
  }

  getDocAccountMovementsView(id: string): Observable<AccountRegister[]> {
    const query = `${this.url}register/account/movements/view/${id}`;
    return (this.http.get(query) as Observable<AccountRegister[]>)
      .catch(err => Observable.of([]))
  }

  getCatalogs(): Observable<any[]> {
    const query = `${this.url}Catalogs`;
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => Observable.of([]))
  }

  getDocuments(): Observable<any[]> {
    const query = `${this.url}Documents`;
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => Observable.of([]))
  }

  /*   call(doc: DocModel, value: string, prop: string) {
      this.lds.loading = true;
      const query = `${this.url}call`;
      const callConfig = { doc: doc, value: value, prop: prop }
      console.log('call ', query, callConfig);
      return this.http.post(query, callConfig).take(1).toPromise()
        .catch(err => Observable.of({}).toPromise())
    }
   */
  valueChanges(doc: DocModel, property: string, value: string) {
    const query = `${this.url}valueChanges/${doc.type}/${property}`;
    const callConfig = { doc: doc, value: value }
    return this.http.post(query, callConfig).take(1)
      .catch(err => Observable.of(Object.assign({})).toPromise())
  }

  getDocRegisterAccumulationList(id: string) {
    const query = `${this.url}register/accumulation/list/${id}`;
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => Observable.of([]))
  }

  getDocAccumulationMovements(type: string, id: string) {
    const query = `${this.url}register/accumulation/${type}/${id}`;
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => Observable.of([]))
  }


  getUserSettings(type: string): Observable<FormListSettings> {
    const query = `${this.url}user/settings/${type}`;
    return (this.http.get(query) as Observable<FormListSettings>)
      .catch(err => Observable.of(new FormListSettings()))
  }

  setUserSettings(type: string, formListSettings: FormListSettings) {
    const query = `${this.url}user/settings/${type}`;
    return (this.http.post(query, formListSettings) as Observable<boolean>)
      .catch(err => Observable.of(false))
  }
}

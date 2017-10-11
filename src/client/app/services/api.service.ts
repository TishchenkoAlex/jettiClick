import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { DocModel } from '../common/doc.model';
import { mapDocToApiFormat } from '../common/mapping/document.mapping';
import { AccountRegister } from './../models/account.register';

export interface DocListResponse { data: any[], total_count: number };

export interface DocListRequest {
  id: string, type: string, command: string, count: number, offset: number,
  orderStr: string,
  filterStr: string,
  filter: DocListFilter[]
}
export interface Continuation { first: DocModel, last: DocModel }
export interface DocListResponse2 { data: any[], continuation: Continuation };
export interface DocListFilter { field: string, operator: '>=' | '>' | '<=' | '<' | '=' | 'ILIKE', value: string | number | boolean };

@Injectable()
export class ApiService {

  private url = environment.api;

  constructor(private http: HttpClient) { }

  getDocList(type: string, id: string, command: string, count = 10, offset = 0, order = '', filter = ''): Observable<DocListResponse2> {
    const query = `${this.url}list`;
    const body: DocListRequest = {
      id: id, type: type, command: command, count: count, offset: offset,
      orderStr: order, filterStr: filter,
      filter: []
    }
    // console.log('LIST API', body, order);
    return this.http.post(query, body) as Observable<DocListResponse2>;
  }

  getView(type: string): Observable<Object> {
    const query = `${this.url}${type}/view/`;
    console.log('VIEW API', query);
    return (this.http.get(query))
      .map(data => data['view'])
      .catch(err => Observable.of({}))
  }

  getViewModel(type: string, id = ''): Observable<Object> {
    if (id === 'new') { id = ''; }
    const query = `${this.url}${type}/view/${id}`;
    console.log('VIEWMODEL API', query);
    return (this.http.get(query))
      .catch(err => Observable.of({}))
  }

  getSuggests(docType: string, filter = ''): Observable<any[]> {
    const query = `${this.url}suggest/${docType}/${filter}`;
    console.log('SUGGEST API', query);
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => Observable.of([]))
  }

  getSuggestsById(id: string): Observable<Object> {
    const query = `${this.url}suggest/${id}`;
    console.log('SUGGEST BY ID API', query);
    return (this.http.get(query))
      .catch(err => Observable.of({}))
  }

  postDoc(doc): Observable<Object> {
    const apiDoc = mapDocToApiFormat(doc);
    const query = `${this.url}`;
    console.log('POST API', query, apiDoc);
    return (this.http.post(query, apiDoc))
      .catch(err => Observable.of(null))
  }

  postDocById(id: string): Observable<boolean> {
    const query = `${this.url}post/${id}`;
    console.log('POST By ID API', query);
    return (this.http.get(query) as Observable<boolean>)
      .catch(err => Observable.of(false));
  }

  deleteDoc(id: string): Observable<Object> {
    const query = `${this.url}${id}`;
    console.log('DELETE', query, id);
    return (this.http.delete(query))
      .catch(err => Observable.of(null))
  }

  getDocAccountMovementsView(id: string): Observable<AccountRegister[]> {
    const query = `${this.url}register/account/movements/view/${id}`;
    console.log('getDocAccountMovements', query);
    return this.http.get(query) as Observable<AccountRegister[]>;
  }

}


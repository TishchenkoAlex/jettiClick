import 'rxjs/add/observable/of';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { catchError, map, take } from 'rxjs/operators';

import { AccountRegister } from '../../../server/models/account.register';
import { DocListRequestBody, DocListResponse2, MenuItem } from '../../../server/models/api';
import { ColumnDef } from '../../../server/models/column';
import { FormListFilter, FormListOrder, FormListSettings, UserDefaultsSettings } from '../../../server/models/user.settings';
import { DocModel } from '../../../server/modules/doc.base';
import { environment } from '../../environments/environment';
import { JettiComplexObject } from '../common/dynamic-form/dynamic-form-base';
import { mapDocToApiFormat } from '../common/mapping/document.mapping';

@Injectable()
export class ApiService {

  private url = environment.api;

  constructor(private http: HttpClient) { }

  getDocList(type: string, id: string, command: string, count = 10, offset = 0,
    order: FormListOrder[] = [], filter: FormListFilter[] = []): Observable<DocListResponse2> {
    const query = `${this.url}list`;
    const body: DocListRequestBody = {
      id: id, type: type, command: command, count: count, offset: offset,
      order: order,
      filter: filter
    }
    return (this.http.post(query, body) as Observable<DocListResponse2>)
      .pipe(catchError(err => Observable.of({ data: [], continuation: null })));
  }

  getView(type: string): Observable<{ view: any[], columnDef: ColumnDef[] }> {
    const query = `${this.url}${type}/view/`;
    return (this.http.get(query)).pipe(
      map(data => ({ view: data['view'], columnDef: data['columnDef'] })),
      catchError(err => Observable.of({ view: [], columnDef: [] })))
  }

  getViewModel(type: string, id = ''): Observable<Object> {
    if (id === 'new') { id = ''; }
    const query = `${this.url}${type}/view/${id}`;
    return (this.http.get(query)).pipe(
      catchError(err => Observable.of({})))
  }

  getSuggests(docType: string, filter = ''): Observable<any[]> {
    const query = `${this.url}suggest/${docType}/${filter}`;
    return (this.http.get(query) as Observable<any[]>).pipe(
      catchError(err => Observable.of([])))
  }

  getSuggestsById(id: string): Observable<Object> {
    const query = `${this.url}suggest/${id}`;
    return (this.http.get(query)).pipe(
      catchError(err => Observable.of({})))
  }

  postDoc(doc: DocModel) {
    const apiDoc = mapDocToApiFormat(doc);
    const query = `${this.url}`;
    return (this.http.post(query, apiDoc) as Observable<DocModel>);
  }

  postDocById(id: string): Observable<boolean> {
    const query = `${this.url}post/${id}`;
    return (this.http.get(query) as Observable<boolean>).pipe(
      catchError(err => Observable.of(false)))
  }

  deleteDoc(id: string): Observable<Object> {
    const query = `${this.url}${id}`;
    return (this.http.delete(query)).pipe(
      catchError(err => Observable.of(null)))
  }

  getDocAccountMovementsView(id: string): Observable<AccountRegister[]> {
    const query = `${this.url}register/account/movements/view/${id}`;
    return (this.http.get<AccountRegister[]>(query)).pipe(
      catchError(err => Observable.of([])))
  }

  getCatalogs(): Observable<MenuItem[]> {
    const query = `${this.url}Catalogs`;
    return (this.http.get<MenuItem[]>(query)).pipe(
      catchError(err => Observable.of(<MenuItem[]>[])))
  }

  getDocuments(): Observable<MenuItem[]> {
    const query = `${this.url}Documents`;
    return (this.http.get<MenuItem[]>(query)).pipe(
      catchError(err => Observable.of(<MenuItem[]>[])))
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
    return this.http.post(query, callConfig).pipe(
      take(1),
      catchError(err => Observable.of(Object.assign({}))))
      .toPromise()
  }

  getDocRegisterAccumulationList(id: string) {
    const query = `${this.url}register/accumulation/list/${id}`;
    return (this.http.get(query) as Observable<any[]>).pipe(
    catchError(err => Observable.of([])))
  }

  getDocAccumulationMovements(type: string, id: string) {
    const query = `${this.url}register/accumulation/${type}/${id}`;
    return (this.http.get(query) as Observable<any[]>).pipe(
      catchError(err => Observable.of([])));
  }

  getOperationsGroups(): Observable<JettiComplexObject[]> {
    const query = `${this.url}operations/groups`;
    return (this.http.get<JettiComplexObject[]>(query)).pipe(
      catchError(err => Observable.of([])));
  }

  getUserFormListSettings(type: string): Observable<FormListSettings> {
    const query = `${this.url}user/settings/${type}`;
    return (this.http.get(query) as Observable<FormListSettings>).pipe(
      catchError(err => Observable.of(new FormListSettings())))
  }

  setUserFormListSettings(type: string, formListSettings: FormListSettings) {
    const query = `${this.url}user/settings/${type}`;
    return (this.http.post(query, formListSettings) as Observable<boolean>).pipe(
      catchError(err => Observable.of(false)))
  }

  getUserDefaultsSettings() {
    const query = `${this.url}user/settings/defaults`;
    return (this.http.get(query) as Observable<UserDefaultsSettings>).pipe(
      catchError(err => Observable.of(new UserDefaultsSettings())))
  }

  setUserDefaultsSettings(value: UserDefaultsSettings) {
    const query = `${this.url}user/settings/defaults`;
    return (this.http.post(query, value) as Observable<boolean>).pipe(
      catchError(err => Observable.of(false)))
  }

  getDocDimensions(type: string) {
    const query = `${this.url}${type}/dimensions`;
    return (this.http.get<any[]>(query)).pipe(
      catchError(err => Observable.of([])))
  }

}

import 'rxjs/add/observable/of';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { AccountRegister } from '../../../server/models/account.register';
import { DocListRequestBody, DocListResponse, PatchValue } from '../../../server/models/api';
import { ColumnDef } from '../../../server/models/column';
import { FormListFilter, FormListOrder, FormListSettings, UserDefaultsSettings } from '../../../server/models/user.settings';
import { environment } from '../../environments/environment';
import { JettiComplexObject } from '../common/dynamic-form/dynamic-form-base';
import { mapDocToApiFormat } from '../common/mapping/document.mapping';
import { DocumentBase } from './../../../server/models/document';
import { getRoleObjects, RoleType } from './../../../server/models/Roles/base';

@Injectable()
export class ApiService {

  private url = environment.api;

  constructor(private http: HttpClient) { }

  getDocList(type: string, id: string, command: string, count = 10, offset = 0,
    order: FormListOrder[] = [], filter: FormListFilter[] = []): Observable<DocListResponse> {
    const query = `${this.url}list`;
    const body: DocListRequestBody = {
      id: id, type: type, command: command, count: count, offset: offset,
      order: order,
      filter: filter
    }
    return (this.http.post(query, body) as Observable<DocListResponse>);
  }

  getView(type: string): Observable<{ view: any[], columnDef: ColumnDef[] }> {
    const query = `${this.url}${type}/view/`;
    return (this.http.get(query)).pipe(
      map(data => ({ view: data['view'], columnDef: data['columnDef'] })));
  }

  getViewModel(type: string, id = ''): Observable<any> {
    const query = `${this.url}${type}/view/${id}`;
    return (this.http.get(query));
  }

  getSuggests(docType: string, filter = ''): Observable<any[]> {
    const query = `${this.url}suggest/${docType}/${filter}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getSuggestsById(id: string): Observable<any> {
    const query = `${this.url}suggest/${id}`;
    return (this.http.get(query));
  }

  postDoc(doc: DocumentBase) {
    const apiDoc = mapDocToApiFormat(doc);
    const query = `${this.url}`;
    return (this.http.post(query, apiDoc) as Observable<DocumentBase>);
  }

  postDocById(id: string): Observable<boolean> {
    const query = `${this.url}post/${id}`;
    return (this.http.get(query) as Observable<boolean>);
  }

  unpostDocById(id: string): Observable<boolean> {
    const query = `${this.url}unpost/${id}`;
    return (this.http.get(query) as Observable<boolean>);
  }

  deleteDoc(id: string): Observable<Object> {
    const query = `${this.url}${id}`;
    return (this.http.delete(query));
  }

  getDocAccountMovementsView(id: string): Observable<AccountRegister[]> {
    const query = `${this.url}register/account/movements/view/${id}`;
    return (this.http.get<AccountRegister[]>(query));
  }

  valueChanges(doc: DocumentBase, property: string, value: string) {
    const query = `${this.url}valueChanges/${doc.type}/${property}`;
    const callConfig = { doc: doc, value: value }
    return this.http.post<PatchValue>(query, callConfig).toPromise();
  }

  onCommand(doc: DocumentBase, command: string, args: { [x: string]: any }) {
    const query = `${this.url}command/${doc.type}/${command}`;
    const callConfig = { doc: doc, args: args }
    return this.http.post(query, callConfig).toPromise()
  }

  getDocRegisterAccumulationList(id: string) {
    const query = `${this.url}register/accumulation/list/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getDocRegisterInfoList(id: string) {
    const query = `${this.url}register/info/list/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getDocAccumulationMovements(type: string, id: string) {
    const query = `${this.url}register/accumulation/${type}/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getOperationsGroups(): Observable<JettiComplexObject[]> {
    const query = `${this.url}operations/groups`;
    return (this.http.get<JettiComplexObject[]>(query));
  }

  getUserFormListSettings(type: string): Observable<FormListSettings> {
    const query = `${this.url}user/settings/${type}`;
    return (this.http.get(query) as Observable<FormListSettings>);
  }

  setUserFormListSettings(type: string, formListSettings: FormListSettings) {
    const query = `${this.url}user/settings/${type}`;
    return (this.http.post(query, formListSettings) as Observable<boolean>);
  }

  getUserDefaultsSettings() {
    const query = `${this.url}user/settings/defaults`;
    return (this.http.get(query) as Observable<UserDefaultsSettings>)
  }

  setUserDefaultsSettings(value: UserDefaultsSettings) {
    const query = `${this.url}user/settings/defaults`;
    return (this.http.post(query, value) as Observable<boolean>)
  }

  getDocDimensions(type: string) {
    const query = `${this.url}${type}/dimensions`;
    return (this.http.get<any[]>(query));
  }

  server(doc: DocumentBase, func: string, params: any): Observable<{ doc: DocumentBase, result: any }> {
    const query = `${this.url}/server/${doc.type}/${func}`;
    return this.http.post<{ doc: DocumentBase, result: any }>(query, { doc: doc, params: params });
  }

  getUserRoles() {
    const query = `${this.url}user/roles`;
    return this.http.get<RoleType[]>(query).pipe(
      map(data => ({ roles: data as RoleType[] || [], Objects: getRoleObjects(data) }))
    );
  }

  call(type: string, formView: any, method: string, params: any[]): Observable<any> {
    const query = `${this.url}/call`;
    return this.http.post(query, {
      type: type,
      method: method,
      formView: formView,
      params: params
    });
  }

}

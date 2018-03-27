import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JobOptions } from 'bull';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';

import { AccountRegister } from '../../../server/models/account.register';
import {
  DocListRequestBody,
  DocListResponse,
  IJob,
  IJobs,
  ISuggest,
  ITree,
  IViewModel,
  PatchValue,
} from '../../../server/models/api';
import { DocumentBase } from '../../../server/models/document';
import { DocTypes } from '../../../server/models/documents.types';
import { getRoleObjects, RoleType } from '../../../server/models/Roles/Base';
import { INoSqlDocument } from '../../../server/models/ServerDocument';
import { FormListFilter, FormListOrder, FormListSettings, UserDefaultsSettings } from '../../../server/models/user.settings';
import { environment } from '../../environments/environment';
import { JettiComplexObject } from '../common/dynamic-form/dynamic-form-base';
import { mapToApi } from '../common/mapping/document.mapping';

@Injectable()
export class ApiService {

  constructor(private http: HttpClient) { }

  getRawDoc(id: string) {
    const query = `${environment.api}raw/${id}`;
    return (this.http.get<INoSqlDocument>(query)).toPromise();
  }

  formControlRef(id: string) {
    const query = `${environment.api}formControlRef/${id}`;
    return (this.http.get<INoSqlDocument>(query)).toPromise();
  }

  getDocList(type: string, id: string, command: string,
    count = 10, offset = 0, order: FormListOrder[] = [], filter: FormListFilter[] = []) {
    const query = `${environment.api}list`;
    const body: DocListRequestBody = { id, type, command, count, offset, order, filter };
    return this.http.post<DocListResponse>(query, body);
  }

  getView(type: string) {
    const query = `${environment.api}view`;
    return this.http.post<IViewModel>(query, { type });
  }

  getViewModel(type: string, id = '', params: { [key: string]: any } = {}) {
    const query = `${environment.api}view`;
    return this.http.post<IViewModel>(query, { type, id, ...params }, { params });
  }

  getSuggests(docType: string, filter = '', isfolder = false) {
    if (!filter) { return of([]); }
    const query = `${environment.api}suggest/${docType}/${isfolder ? 'isfolder/' : ''}${filter}`;
    return (this.http.get<ISuggest[]>(query));
  }

  getSuggestsById(id: string): Observable<any> {
    const query = `${environment.api}suggest/${id}`;
    return (this.http.get(query));
  }

  postDoc(doc: DocumentBase, mode: 'post' | 'save' = 'save') {
    const apiDoc = mapToApi(doc);
    const query = `${environment.api}`;
    return (this.http.post<DocumentBase>(query, apiDoc, { params: { mode } }));
  }

  postDocById(id: string): Observable<boolean> {
    const query = `${environment.api}post/${id}`;
    return (this.http.get(query) as Observable<boolean>);
  }

  unpostDocById(id: string): Observable<boolean> {
    const query = `${environment.api}unpost/${id}`;
    return (this.http.get(query) as Observable<boolean>);
  }

  deleteDoc(id: string): Observable<DocumentBase> {
    const query = `${environment.api}${id}`;
    return (this.http.delete<DocumentBase>(query));
  }

  getDocAccountMovementsView(id: string): Observable<AccountRegister[]> {
    const query = `${environment.api}register/account/movements/view/${id}`;
    return (this.http.get<AccountRegister[]>(query));
  }

  getDocRegisterAccumulationList(id: string) {
    const query = `${environment.api}register/accumulation/list/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getDocRegisterInfoList(id: string) {
    const query = `${environment.api}register/info/list/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getDocAccumulationMovements(type: string, id: string) {
    const query = `${environment.api}register/accumulation/${type}/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }

  getDocInfoMovements(type: string, id: string) {
    const query = `${environment.api}register/info/${type}/${id}`;
    return (this.http.get(query) as Observable<any[]>);
  }


  getOperationsGroups(): Observable<JettiComplexObject[]> {
    const query = `${environment.api}operations/groups`;
    return (this.http.get<JettiComplexObject[]>(query));
  }

  getUserFormListSettings(type: string): Observable<FormListSettings> {
    const query = `${environment.api}user/settings/${type}`;
    return (this.http.get(query) as Observable<FormListSettings>);
  }

  setUserFormListSettings(type: string, formListSettings: FormListSettings) {
    const query = `${environment.api}user/settings/${type}`;
    return (this.http.post(query, formListSettings) as Observable<boolean>);
  }

  getUserDefaultsSettings() {
    const query = `${environment.api}user/settings/defaults`;
    return (this.http.get(query) as Observable<UserDefaultsSettings>);
  }

  setUserDefaultsSettings(value: UserDefaultsSettings) {
    const query = `${environment.api}user/settings/defaults`;
    return (this.http.post(query, value) as Observable<boolean>);
  }

  getDocDimensions(type: string) {
    const query = `${environment.api}${type}/dimensions`;
    return (this.http.get<any[]>(query));
  }

  getUserRoles() {
    const query = `${environment.api}user/roles`;
    return this.http.get<RoleType[]>(query).pipe(
      map(data => ({ roles: data as RoleType[] || [], Objects: getRoleObjects(data) }))
    );
  }

  valueChanges(doc: DocumentBase, property: string, value: string) {
    const apiDoc = mapToApi(doc);
    const query = `${environment.api}valueChanges/${doc.type}/${property}`;
    const callConfig = { doc: apiDoc, value: value };
    return this.http.post<PatchValue>(query, callConfig).toPromise();
  }

  onCommand(doc: DocumentBase, command: string, args: { [x: string]: any }) {
    const query = `${environment.api}command/${doc.type}/${command}`;
    const callConfig = { doc: doc, args: args };
    return this.http.post(query, callConfig).toPromise();
  }

  docMethodOnServer(doc: DocumentBase, func: string, params: any): Observable<{ doc: DocumentBase, result: any }> {
    const query = `${environment.api}/server/${doc.type}/${func}`;
    return this.http.post<{ doc: DocumentBase, result: any }>(query, { doc, params });
  }

  call(type: string, formView: any, method: string, params: any[], async = false): Observable<any> {
    const query = `${environment.api}call/${async ? 'async' : ''}`;
    return this.http.post(query, {
      type: type,
      method: method,
      formView: formView,
      params: params
    });
  }

  jobAdd(data: any, opts?: JobOptions) {
    const query = `${environment.api}jobs/add`;
    return this.http.post<IJob>(query, { data: data, opts: opts });
  }

  jobs() {
    const query = `${environment.api}jobs`;
    return this.http.get<IJobs>(query);
  }

  jobById(id: string) {
    const query = `${environment.api}jobs/${id}`;
    return this.http.get<IJob>(query);
  }

  tree(type: DocTypes) {
    const query = `${environment.api}tree/${type}`;
    return this.http.get<ITree[]>(query);
  }

}
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiService {

  private url = environment.api;

  constructor(private http: HttpClient) {}

  getDocList(type: string, skip = 0, top = 50, order = '', filter = ''): Observable<Object> {
    // tslint:disable-next-line:max-line-length
    const query = `${this.url}${type}/list?$top=${top}&$skip=${skip}&$filter=${filter}&$order=${order}`;
    return (this.http.get(query))
      .catch(err => {
        return Observable.of(null);
      });
  }

  getView(type: string): Observable<any[]> {
    const query = `${this.url}${type}/view/`;
    return (this.http.get(query) as Observable<any[]>)
      .map(data => data['view'])
      .catch(err => {
        return Observable.of<any[]>([]);
      });
  }

  getViewModel(type: string, id = ''): Observable<Object> {
    if (id === 'new') { id = ''; }
    const query = `${this.url}${type}/view/${id}`;
    return (this.http.get(query))
      .catch(err => {
        return Observable.of(null);
      });
  }

  getSuggests(docType: string, filter = ''): Observable<any[]> {
    const query = `${this.url}suggest/${docType}/${filter}`;
    return (this.http.get(query) as Observable<any[]>)
      .catch(err => {
        return Observable.of<any[]>([]);
      });
  }

  postDoc(doc): Observable<Object> {
    const query = `${this.url}`;
    return (this.http.post(query, doc))
      .catch(err => {
        return Observable.of<Object>();
      });
  }

  deleteDoc(id: string): Observable<Object> {
    const query = `${this.url}${id}`;
    return (this.http.delete(query))
      .catch(err => {
        return Observable.of<Object>();
      });
  }

}


import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiService {

    private url = environment.api;
    // private url = 'http://localhost:3000/api/'

    constructor(private http: HttpClient) {
    }

    getDocList(type, skip = 0, top = 50, order = '', sortOrder = 1, filter = ''): Observable<any[]> {
        // tslint:disable-next-line:max-line-length
        const query = `${this.url}${type}/list?$top=${top}&$skip=${skip}&$filter=${filter}&$order=${order}${sortOrder === 1 ? '' : ' desc'}`;
        console.log(query);
        return (this.http.get(query) as Observable<any[]>)
        .catch(err => {
            return Observable.of<any[]>([]);
        });
    }

    getView(type): Observable<any[]> {
        const query = `${this.url}${type}/view/`;
        return (this.http.get(query) as Observable<any[]>)
        .map(data => data['view'])
        .catch(err => {
            return Observable.of<any[]>([]);
        });
    }

    getDocsCount(type, filter?): Observable<number> {
        const query = `${this.url}${type}/list?$filter=${filter}&$count`;
        console.log(query);
        return this.http.get(query)
        .map(data => data[0]['count'])
        .catch(err => {
            console.log('Err', err);
            return Observable.of<any[]>([]);
        });
    }

    getSuggests(docType: string, filter = ''): Observable<any[]> {
        const query = `${this.url}suggest/${docType}/${filter}`;
        console.log(query);
        return (this.http.get(query) as Observable<any[]>)
        .catch(err => {
            console.log('Err', err);
            return Observable.of<any[]>([]);
        });
      }
}


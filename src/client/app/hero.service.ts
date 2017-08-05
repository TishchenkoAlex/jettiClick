import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Hero } from './hero';
import { environment } from '../environments/environment';

const api = environment.api;
// const api = '/api';

@Injectable()
export class HeroService {
  constructor(private http: HttpClient) {}

  getHeroes() {
    console.log(api);
    return this.http.get<Array<Hero>>(`${api}/suggest/Catalog.Managers/`)
  }

  deleteHero(hero: Hero) {
    return this.http.delete(`${api}/hero/${hero.id}`);
  }

  addHero(hero: Hero) {
    return this.http.post<Hero>(`${api}/hero/`, hero);
  }

  updateHero(hero: Hero) {
    return this.http.put<Hero>(`${api}/hero/${hero.id}`, hero);
  }
}

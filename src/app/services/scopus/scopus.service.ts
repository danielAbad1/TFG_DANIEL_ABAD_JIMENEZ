import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScopusService {
  private readonly API_KEY = 'f1703e1aaad201cd20f49bedebe13356';
  private readonly BASE_URL = 'https://api.elsevier.com/content/search/scopus';

  constructor(private http: HttpClient) {}

  getPublicaciones(offset = 0, count = 5): Observable<any> {
    const params = new HttpParams()
      .set('query', 'AFFIL("Universidad de Extremadura")')
      .set('count', count.toString())
      .set('start', offset.toString());

    const headers = new HttpHeaders({
      'X-ELS-APIKey': this.API_KEY,
      Accept: 'application/json',
    });

    return this.http.get(this.BASE_URL, { headers, params });
  }

  /**
   * Busca publicaciones por una palabra clave, filtrando por afiliación a la Universidad de Extremadura.
   * @param keyword palabra clave a buscar en KEY()
   * @param offset inicio de resultados paginados (opcional)
   * @param count número de resultados a devolver (opcional)
   */
  buscarPorKeywords(
    keywords: string[],
    offset = 0,
    count = 25
  ): Observable<any> {
    const keywordQuery = keywords
      .filter((k) => k.trim() !== '')
      .map((k) => `KEY("${k.trim()}")`)
      .join(' AND ');

    const query = `(${keywordQuery}) AND (AFFIL("Universidad de Extremadura") OR AFFIL("University of Extremadura"))`;

    const params = new HttpParams()
      .set('query', query)
      .set('count', count.toString())
      .set('start', offset.toString());

    const headers = new HttpHeaders({
      'X-ELS-APIKey': this.API_KEY,
      Accept: 'application/json',
    });

    return this.http.get(this.BASE_URL, { headers, params });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DrinkApiResponse, IngredientApiResponse } from '../models/cocktail.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CocktailService {
  private http = inject(HttpClient);
  private baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';

  searchByName(name: string): Observable<DrinkApiResponse> {
    const params = new HttpParams().set('drinkName', name);
    return this.http.get<DrinkApiResponse>(`${this.baseUrl}search.php`, { params });
  }

  searchByIngredient(ingredient: string): Observable<IngredientApiResponse> {
    const params = new HttpParams().set('ingredientName', ingredient);
    return this.http.get<IngredientApiResponse>(`${this.baseUrl}filter.php`, { params });
  }

  searchById(id: string): Observable<IngredientApiResponse> {
    const params = new HttpParams().set('ingredientId', id);
    return this.http.get<IngredientApiResponse>(`${this.baseUrl}lookup.php`, { params });
  }
}

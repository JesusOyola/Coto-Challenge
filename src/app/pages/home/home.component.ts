// src/app/pages/home/home.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card'; 

import { CocktailService } from '../../services/cocktail.service';
import { CocktailStore } from '../../store/cocktail.store';
import {
  Subject,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil,
  Observable,
} from 'rxjs';
import { CocktailSearchComponent } from '../../components/cocktail-search/cocktail-search.component';
import { CocktailListComponent } from '../../components/cocktail-list/cocktail-list.component';
import { Drink, DrinkApiResponse, IngredientApiResponse } from '../../models/cocktail.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule, 
    CocktailSearchComponent,
    CocktailListComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public store = inject(CocktailStore);
  private cocktailService = inject(CocktailService);
  private destroy$ = new Subject<void>();

  
  private searchTerm$ = new Subject<{ type: 'name' | 'ingredient' | 'id'; value: string }>();

  // Exponer señales del store al template
  public readonly displayCocktails = this.store.displayCocktails;
  public readonly isLoading = this.store.isLoading;
  public readonly filterOnlyFavorites = this.store.filterOnlyFavorites;
  public readonly hasFavorites = this.store.hasFavorites;
  public readonly error = this.store.error; // Exponer el error del store

  ngOnInit(): void {
    this.store.loadFavoritesFromStorage();
    this._loadInitialData();
    this._setupSearchStream();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  
  private _loadInitialData(): void {
    if (this.store.cocktails().length === 0 && this.store.lastSearchTerm() === '') {
      this.performSearch({ type: 'name', value: 'a' });
    }
  }

  
   //Configura el pipeline reactivo para manejar el input de búsqueda.
   
  private _setupSearchStream(): void {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => prev.value === curr.value && prev.type === curr.type),
        filter((term) => term.value.trim().length > 0),
        tap((term) => this.store.startLoading(term.value)),
        switchMap((term) => this.selectSearchMethod(term)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => this._handleSearchSuccess(response as DrinkApiResponse),
        error: (err) => this._handleSearchError(err),
      });
  }
  
  private _handleSearchSuccess(response: DrinkApiResponse): void {
    const cocktails: Drink[] = response.drinks || [];
    this.store.setCocktails(cocktails);
  }

  
   // Maneja los errores de la llamada al API.
   
  private _handleSearchError(err: unknown): void {
    console.error(err);
    this.store.setError('Error al conectar con la API o al procesar los datos.');
  }

  
  private selectSearchMethod(term: {
    type: 'name' | 'ingredient' | 'id';
    value: string;
  }): Observable<DrinkApiResponse | IngredientApiResponse> {
    if (term.type === 'name') {
      return this.cocktailService.searchByName(term.value);
    } else if (term.type === 'ingredient') {
     
      return this.cocktailService.searchByIngredient(term.value);
    } else if (term.type === 'id') {
      return this.cocktailService.searchById(term.value);
    }
    
    return this.cocktailService.searchByName(term.value);
  }

  // Maneja la emisión del componente de búsqueda
  onSearch(term: { type: 'name' | 'ingredient' | 'id'; value: string }): void {
    this.searchTerm$.next(term);
  }

  
  performSearch(term: { type: 'name' | 'ingredient' | 'id'; value: string }): void {
    this.searchTerm$.next(term);
  }

  // Activa/desactiva el filtro de favoritos (usa el método del store)
  toggleFavoriteFilter(): void {
    this.store.toggleFilterFavorites();
  }

  
}

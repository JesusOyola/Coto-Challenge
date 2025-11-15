import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';


import { CocktailService } from '../../services/cocktail.service';
import { CocktailStore, broadcastChannel } from '../../store/cocktail.store';
import {
  Subject,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil,
  Observable,
  fromEvent,
} from 'rxjs';
import { CocktailSearchComponent } from '../../components/cocktail-search/cocktail-search.component';
import { CocktailListComponent } from '../../components/cocktail-list/cocktail-list.component';
import { Drink, DrinkApiResponse, IngredientApiResponse } from '../../models/cocktail.interface';

const SCROLL_POSITION_KEY = 'home_scroll_position';
const SEARCH_STATE_KEY = 'home_search_state';

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
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  public store = inject(CocktailStore);
  private cocktailService = inject(CocktailService);
  public destroy$ = new Subject<void>();

  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLDivElement>;

  @ViewChild('errorMessageRef') errorMessageRef!: ElementRef<HTMLElement>;

  private searchTerm$ = new Subject<{ type: 'name' | 'ingredient' | 'id'; value: string }>();

  private lastErrorState: string | null = null;

  public readonly displayCocktails = this.store.displayCocktails;
  public readonly isLoading = this.store.isLoading;
  public readonly filterOnlyFavorites = this.store.filterOnlyFavorites;
  public readonly hasFavorites = this.store.hasFavorites;
  public readonly error = this.store.error;
  public broadcastChannel?: BroadcastChannel;

  ngOnInit(): void {
    this.store.loadFavoritesFromStorage();

    this._setupMultitabSync();

    this._loadInitialData();

    this._setupSearchStream();
  }

  ngAfterViewInit(): void {
    if (this.scrollContainerRef) {
      this._restoreScrollPosition();
      this._setupScrollSaving();
    }
  }

  // Manejo del foco para accesibilidad cuando un error o mensaje de estado aparece
  ngAfterViewChecked(): void {
    const currentError = this.error();
    if (currentError && currentError !== this.lastErrorState && this.errorMessageRef) {
      setTimeout(() => {
        this.errorMessageRef.nativeElement.focus();
      }, 0);
    }
    this.lastErrorState = currentError;
  }

  ngOnDestroy(): void {
    this._saveScrollPosition();

    broadcastChannel.close();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // MANEJO DE ESTADO PERSISTENTE (SCROLL - sessionStorage)

  private _setupScrollSaving(): void {
    fromEvent(this.scrollContainerRef.nativeElement, 'scroll')
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => this._saveScrollPosition());
  }

  private _saveScrollPosition(): void {
    if (this.scrollContainerRef) {
      sessionStorage.setItem(
        SCROLL_POSITION_KEY,
        this.scrollContainerRef.nativeElement.scrollTop.toString(),
      );
    }
  }

  private _restoreScrollPosition(): void {
    const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition && this.scrollContainerRef) {
      setTimeout(() => {
        this.scrollContainerRef.nativeElement.scrollTop = parseInt(savedPosition, 10);
      }, 0);
    }
  }

  // MANEJO DE SINCRONIZACIÓN MULTITAB

  private _setupMultitabSync(): void {
    broadcastChannel.onmessage = (event) => {
      if (!event.data) return;

      if (event.data.type === 'FAVORITES_UPDATED') {
        this.store.syncFavorites(event.data.payload as Drink[]);
        console.log('Favoritos sincronizados desde otra pestaña.');
      }

      if (event.data.type === 'SEARCH_STATE_UPDATED') {
        const state = event.data.payload;

        if (!this.isLoading() && !this.filterOnlyFavorites()) {
          this._restoreStateFromParsed(state);
          console.log(`Búsqueda sincronizada: "${state.term}"`);
        }
      }
    };
  }

  private _loadInitialData(): void {
    if (this._tryRestoreSavedState()) {
      return;
    }

    if (this.store.cocktails().length === 0 && this.store.lastSearchTerm() === '') {
      this.performSearch({ type: 'name', value: 'a' });
    }
  }

  private _tryRestoreSavedState(): boolean {
    const savedState = localStorage.getItem(SEARCH_STATE_KEY);

    if (!savedState) {
      return false;
    }

    const state = this._parseSavedState(savedState);
    if (!state) {
      localStorage.removeItem(SEARCH_STATE_KEY);
      return false;
    }

    return this._restoreStateFromParsed(state);
  }

  private _parseSavedState(savedState: string): { term?: string; cocktails?: Drink[] } | null {
    try {
      return JSON.parse(savedState);
    } catch {
      return null;
    }
  }

  private _restoreStateFromParsed(state: { term?: string; cocktails?: Drink[] }): boolean {
    if (state.cocktails && state.cocktails.length >= 0) {
      this.store.patchState({
        cocktails: state.cocktails,
        lastSearchTerm: state.term,
        isLoading: false,
        error: null,
      });
      return true;
    }
    return false;
  }

  private _setupSearchStream(): void {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => prev.value === curr.value && prev.type === curr.type),
        filter((term) => term.value.trim().length > 0),
        tap((term) => {
          this.store.startLoading(term.value);
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        }),
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

    const stateToSave = {
      term: this.store.lastSearchTerm(),
      cocktails: cocktails,
    };

    localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(stateToSave));

    broadcastChannel.postMessage({
      type: 'SEARCH_STATE_UPDATED',
      payload: stateToSave,
    });
  }

  private _handleSearchError(err: unknown): void {
    console.error(err);
    this.store.setError('Error al conectar con la API o al procesar los datos.');

    localStorage.removeItem(SEARCH_STATE_KEY);
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

  onSearch(term: { type: 'name' | 'ingredient' | 'id'; value: string }): void {
    this.searchTerm$.next(term);
  }

  performSearch(term: { type: 'name' | 'ingredient' | 'id'; value: string }): void {
    this.searchTerm$.next(term);
  }

  toggleFavoriteFilter(): void {
    this.store.toggleFilterFavorites();
  }
}

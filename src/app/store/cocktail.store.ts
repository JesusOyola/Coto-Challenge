import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CocktailState } from './models/cocktailStore.interface';
import { Drink } from '../models/cocktail.interface';
const initialState: CocktailState = {
  cocktails: [],
  favorites: [],
  isLoading: false,
  error: null,
  lastSearchTerm: '',
  filterOnlyFavorites: false,
};

export const CocktailStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ cocktails, favorites, filterOnlyFavorites }) => ({
    
    isFavorite: computed(
      () => (idDrink: string) => favorites().some((fav) => fav.idDrink === idDrink),
    ),

    // Retorna la lista final a mostrar (filtrada o no)
    displayCocktails: computed(() => {
      const allCocktails = cocktails();
      const favs = favorites();
      if (filterOnlyFavorites()) {
       
        return allCocktails.filter((c) => favs.some((f) => f.idDrink === c.idDrink));
      }

      console.log(allCocktails);
      return allCocktails;
    }),

    
    hasFavorites: computed(() => favorites().length > 0),
  })),

  
  withMethods(({ favorites, ...store }) => ({
    setCocktails(cocktails: Drink[] | 'no data found') {
      const drinks = (typeof cocktails === 'string' && cocktails === 'no data found')
        ? []
        : (cocktails as Drink[]);
      patchState(store, { cocktails: drinks, isLoading: false, error: null });
    },

    // Inicia una carga
    startLoading(term: string) {
      patchState(store, { isLoading: true, lastSearchTerm: term });
    },

    // Establece error
    setError(error: string) {
      patchState(store, { isLoading: false, error });
    },

    // Añadir/Remover de favoritos el cocktail
    toggleFavorite(cocktail: Drink) {
      const currentFavorites = favorites();
      const isFav = currentFavorites.some((fav) => fav.idDrink === cocktail.idDrink);

      if (isFav) {
        const newFavorites = currentFavorites.filter((fav) => fav.idDrink !== cocktail.idDrink);
        patchState(store, { favorites: newFavorites });
        localStorage.setItem('cocktail_favorites', JSON.stringify(newFavorites));
      } else {
        const newFavorites = [...currentFavorites, cocktail];
        patchState(store, { favorites: newFavorites });
        localStorage.setItem('cocktail_favorites', JSON.stringify(newFavorites));
      }
    },

    // Carga los favoritos desde el LocalStorage al iniciar la app o al sincronizar
    loadFavoritesFromStorage() {
      const storedFavs = localStorage.getItem('cocktail_favorites');
      if (storedFavs) {
        try {
          const favorites: Drink[] = JSON.parse(storedFavs);
          patchState(store, { favorites });
        } catch (e) {
          console.error('Error parsing favorites from storage', e);
        }
      }
    },

    // Alternar el filtro de solo favoritos
    toggleFilterFavorites() {
      patchState(store, (state) => ({
        filterOnlyFavorites: !state.filterOnlyFavorites,
      }));
    },
  })),
);

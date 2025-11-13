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

const FAVORITES_STORAGE_KEY = 'cocktail_favorites';

const broadcastChannel = new BroadcastChannel('cocktail-sync-channel');

export const CocktailStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ cocktails, favorites, filterOnlyFavorites }) => ({
    isFavorite: computed(
      () => (idDrink: string) => favorites().some((fav) => fav.idDrink === idDrink),
    ),

    // Retorna la lista final a mostrar
    displayCocktails: computed(() => {
      const allCocktails = cocktails();
      const favs = favorites();

      if (filterOnlyFavorites()) {
        return favs;
      }
      return allCocktails;
    }),

    hasFavorites: computed(() => favorites().length > 0),
  })),

  withMethods(({ favorites, ...store }) => ({
    setCocktails(cocktails: Drink[] | 'no data found') {
      const drinks =
        typeof cocktails === 'string' && cocktails === 'no data found'
          ? []
          : (cocktails as Drink[]);
      patchState(store, { cocktails: drinks, isLoading: false, error: null });
    },

    startLoading(term: string) {
      patchState(store, { isLoading: true, lastSearchTerm: term });
    },

    setError(error: string) {
      patchState(store, { isLoading: false, error });
    },

    // Añadir/Remover de favoritos el cocktail
    toggleFavorite(cocktail: Drink) {
      const currentFavorites = favorites();
      const isFav = currentFavorites.some((fav) => fav.idDrink === cocktail.idDrink);

      let newFavorites: Drink[];

      if (isFav) {
        newFavorites = currentFavorites.filter((fav) => fav.idDrink !== cocktail.idDrink);
      } else {
        newFavorites = [...currentFavorites, cocktail];
      }

      patchState(store, { favorites: newFavorites });

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));

      broadcastChannel.postMessage({ type: 'FAVORITES_UPDATED', payload: newFavorites });
    },

    // Carga los favoritos desde el LocalStorage
    loadFavoritesFromStorage() {
      const storedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavs) {
        try {
          const favorites: Drink[] = JSON.parse(storedFavs);
          patchState(store, { favorites });
        } catch (e) {
          console.error('Error parsing favorites from storage', e);
        }
      }
    },

    // Maneja la actualización de favoritos desde el BroadcastChannel
    syncFavorites(newFavorites: Drink[]) {
      patchState(store, { favorites: newFavorites });
    },

    toggleFilterFavorites() {
      patchState(store, (state) => ({
        filterOnlyFavorites: !state.filterOnlyFavorites,
      }));
    },

    // Método para exponer patchState para restaurar el estado de búsqueda
    patchState(state: Partial<CocktailState>) {
      patchState(store, state);
    },
  })),
);

// Exportar el canal para que HomeComponent pueda escucharlo y cerrarlo en OnDestroy
export { broadcastChannel };

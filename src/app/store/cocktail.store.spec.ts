import { TestBed } from '@angular/core/testing';
import {
  CocktailStore as CocktailStoreClass,
  broadcastChannel,
  FAVORITES_STORAGE_KEY,
} from './cocktail.store';
import { Drink } from '../models/cocktail.interface';

// Mock del localStorage simple (objeto en memoria)
let localStorageMock: Record<string, string> = {};

// Reemplazar la implementación global de localStorage por el mock
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => (localStorageMock[key] !== undefined ? localStorageMock[key] : null),
    setItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageMock[key];
    },
    clear: () => {
      localStorageMock = {};
    },
  } as Storage,
  writable: true,
  configurable: true,
});

describe('CocktailStore', () => {
  let store: InstanceType<typeof CocktailStoreClass>;

  const mockDrink1: Drink = { idDrink: '1', strDrink: 'Mojito' } as Drink;
  const mockDrink2: Drink = { idDrink: '2', strDrink: 'Margarita' } as Drink;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CocktailStoreClass);

    // limpiar mock antes de cada test
    localStorageMock = {};
    // resetear el estado del store mediante el método público patchState
    store.patchState({
      cocktails: [],
      favorites: [],
      isLoading: false,
      error: null,
      lastSearchTerm: '',
      filterOnlyFavorites: false,
    });

    // espiar el BroadcastChannel
    spyOn(broadcastChannel, 'postMessage');
  });

  it('should be created and initialize with default state', () => {
    expect(store).toBeTruthy();
    expect(store.cocktails()).toEqual([]);
    expect(store.isLoading()).toBeFalse();
    expect(store.lastSearchTerm()).toEqual('');
    expect(store.error()).toBeNull();
  });

  // --- Tests de Métodos de Estado ---

  it('should set cocktails and update state', () => {
    store.setCocktails([mockDrink1]);
    expect(store.cocktails()).toEqual([mockDrink1]);
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('should clear cocktails if "no data found" is passed', () => {
    store.setCocktails('no data found');
    expect(store.cocktails()).toEqual([]);
  });

  it('should start loading with a search term', () => {
    store.startLoading('Vodka');
    expect(store.isLoading()).toBeTrue();
    expect(store.lastSearchTerm()).toEqual('Vodka');
  });

  it('should set error state', () => {
    store.setError('API Offline');
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toEqual('API Offline');
  });

  // --- Tests de Computed Signals ---

  it('should report hasFavorites correctly', () => {
    // inicialmente sin favoritos
    expect(store.hasFavorites()).toBeFalse();

    // usar patchState para setear favoritos y verificar computed
    store.patchState({ favorites: [mockDrink1] });
    expect(store.hasFavorites()).toBeTrue();
  });

  it('should correctly determine if a drink is a favorite', () => {
    store.patchState({ favorites: [mockDrink2] });

    // isFavorite devuelve una función (id => boolean)
    const isFavFn = store.isFavorite();
    expect(isFavFn('1')).toBeFalse(); // '1' no está en favorites
    expect(isFavFn('2')).toBeTrue();  // '2' sí está en favorites
  });

  it('should display all cocktails if filterOnlyFavorites is false', () => {
    store.patchState({
      cocktails: [mockDrink1, mockDrink2],
      favorites: [mockDrink1],
      filterOnlyFavorites: false,
    });

    expect(store.displayCocktails()).toEqual([mockDrink1, mockDrink2]);
  });

  it('should display only favorites if filterOnlyFavorites is true', () => {
    store.patchState({
      cocktails: [mockDrink1, mockDrink2],
      favorites: [mockDrink1],
      filterOnlyFavorites: true,
    });

    expect(store.displayCocktails()).toEqual([mockDrink1]);
  });

  it('should toggle filterOnlyFavorites state', () => {
    expect(store.filterOnlyFavorites()).toBeFalse();
    store.toggleFilterFavorites();
    expect(store.filterOnlyFavorites()).toBeTrue();
    store.toggleFilterFavorites();
    expect(store.filterOnlyFavorites()).toBeFalse();
  });

  // --- Tests de Favoritos y Persistencia ---

  it('should add a cocktail to favorites and persist it', () => {
    store.toggleFavorite(mockDrink1);

    expect(store.favorites()).toEqual([mockDrink1]);
    expect(localStorageMock[FAVORITES_STORAGE_KEY]).toEqual(JSON.stringify([mockDrink1]));
    expect(broadcastChannel.postMessage).toHaveBeenCalledWith({
      type: 'FAVORITES_UPDATED',
      payload: [mockDrink1],
    });
  });

  it('should remove a cocktail from favorites and persist the change', () => {
    // preparar estado inicial con dos favoritos
    store.patchState({ favorites: [mockDrink1, mockDrink2] });
    localStorageMock[FAVORITES_STORAGE_KEY] = JSON.stringify([mockDrink1, mockDrink2]);

    store.toggleFavorite(mockDrink1);
    const expectedFavs = [mockDrink2];

    expect(store.favorites()).toEqual(expectedFavs);
    expect(localStorageMock[FAVORITES_STORAGE_KEY]).toEqual(JSON.stringify(expectedFavs));
    expect(broadcastChannel.postMessage).toHaveBeenCalledWith({
      type: 'FAVORITES_UPDATED',
      payload: expectedFavs,
    });
  });

  it('should load favorites from localStorage on startup', () => {
    // preparar storage con favoritos
    localStorageMock[FAVORITES_STORAGE_KEY] = JSON.stringify([mockDrink2]);

    // usar el mismo store e invocar el método de carga
    store.loadFavoritesFromStorage();

    expect(store.favorites()).toEqual([mockDrink2]);
  });

  it('should sync favorites state when receiving update from BroadcastChannel', () => {
    const newFavorites = [mockDrink1, mockDrink2];
    store.syncFavorites(newFavorites);

    expect(store.favorites()).toEqual(newFavorites);

    // syncFavorites no debe modificar localStorage (solo parchea el estado)
    expect(localStorageMock[FAVORITES_STORAGE_KEY]).toBeUndefined();
  });
});
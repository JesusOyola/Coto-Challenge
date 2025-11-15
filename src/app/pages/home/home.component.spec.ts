import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CocktailService } from '../../services/cocktail.service';
import { ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { CocktailStore } from '../../store/cocktail.store';
import { Drink, DrinkApiResponse } from '../../models/cocktail.interface';

// --- Claves de Storage (Consistentes con el Componente) ---
const SCROLL_POSITION_KEY = 'home_scroll_position';
const SEARCH_STATE_KEY = 'home_search_state';

// --- Mocks de Datos ---
const mockDrink = { idDrink: '1', strDrink: 'Mocktail' } as Drink;
const mockSuccessResponse: DrinkApiResponse = { drinks: [mockDrink] };

// --- Mocks de Dependencias ---

const mockCocktailService = {
  searchByName: jasmine.createSpy('searchByName').and.returnValue(of(mockSuccessResponse)),
  searchByIngredient: jasmine.createSpy('searchByIngredient').and.returnValue(of({ drinks: [] })),
  searchById: jasmine.createSpy('searchById').and.returnValue(of({ drinks: [] })),
};

const mockStore = {
  setCocktails: jasmine.createSpy('setCocktails'),
  setError: jasmine.createSpy('setError'),
  loadFavoritesFromStorage: jasmine.createSpy('loadFavoritesFromStorage'),
  patchState: jasmine.createSpy('patchState'),
  toggleFilterFavorites: jasmine.createSpy('toggleFilterFavorites'),
  startLoading: jasmine.createSpy('startLoading'),
  syncFavorites: jasmine.createSpy('syncFavorites'),
  cocktails: jasmine.createSpy('cocktails').and.returnValue([]),
  lastSearchTerm: jasmine.createSpy('lastSearchTerm').and.returnValue(''),
  displayCocktails: jasmine.createSpy('displayCocktails').and.returnValue([]),
  isLoading: jasmine.createSpy('isLoading').and.returnValue(false),
  filterOnlyFavorites: jasmine.createSpy('filterOnlyFavorites').and.returnValue(false),
  hasFavorites: jasmine.createSpy('hasFavorites').and.returnValue(false),
  error: jasmine.createSpy('error').and.returnValue(null),
};

let mockBroadcastChannel: {
  postMessage: jasmine.Spy;
  close: jasmine.Spy;
  onmessage: ((event: { data: unknown }) => void) | null;
};

let localStorageStore: Record<string, string> = {};
let sessionStorageStore: Record<string, string> = {};

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    mockBroadcastChannel = {
      postMessage: jasmine.createSpy('postMessage'),
      close: jasmine.createSpy('close'),
      onmessage: null,
    };

    (window as unknown as { BroadcastChannel: unknown }).BroadcastChannel = function () {
      return mockBroadcastChannel;
    };

    // Sobrescribir la instancia importada (ya que el componente la importa directamente)
    Object.defineProperty(globalThis, 'broadcastChannel', {
      value: mockBroadcastChannel,
      writable: true,
      configurable: true,
    });

    // Mocks de Storage
    localStorageStore = {};
    sessionStorageStore = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageStore[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageStore[key];
    });

    spyOn(sessionStorage, 'getItem').and.callFake(
      (key: string) => sessionStorageStore[key] || null,
    );
    spyOn(sessionStorage, 'setItem').and.callFake((key: string, value: string) => {
      sessionStorageStore[key] = value;
    });
    spyOn(sessionStorage, 'removeItem').and.callFake((key: string) => {
      delete sessionStorageStore[key];
    });

    // Resetear spies de mocks
    mockCocktailService.searchByName.calls.reset();
    mockCocktailService.searchByIngredient.calls.reset();
    mockCocktailService.searchById.calls.reset();

    // Resetear todos los spies del store
    Object.values(mockStore).forEach((spy) => {
      if (spy && (spy as jasmine.Spy).calls) {
        (spy as jasmine.Spy).calls.reset();
      }
    });

    // Configurar comportamiento por defecto del Store
    mockStore.cocktails.and.returnValue([]);
    mockStore.lastSearchTerm.and.returnValue('');
    mockStore.error.and.returnValue(null);
    mockStore.isLoading.and.returnValue(false);
    mockStore.filterOnlyFavorites.and.returnValue(false);

    // Configurar comportamiento por defecto del Service
    mockCocktailService.searchByName.and.returnValue(of(mockSuccessResponse));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}) } },
        { provide: CocktailStore, useValue: mockStore },
        { provide: CocktailService, useValue: mockCocktailService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    // --- Mockear ViewChilds ---

    component.errorMessageRef = {
      nativeElement: jasmine.createSpyObj('nativeElement', ['focus']),
    } as unknown as ElementRef;

    component.scrollContainerRef = {
      nativeElement: {
        scrollTop: 0,
        addEventListener: jasmine.createSpy(),
        removeEventListener: jasmine.createSpy(),
      },
    } as unknown as ElementRef;
  });

  it('should restore state from localStorage IF present (and skip initial search)', () => {
    const savedState = { term: 'vodka', cocktails: [mockDrink] };
    localStorageStore[SEARCH_STATE_KEY] = JSON.stringify(savedState);

    fixture.detectChanges();

    expect(mockStore.loadFavoritesFromStorage).toHaveBeenCalled();
    expect(localStorage.getItem).toHaveBeenCalledWith(SEARCH_STATE_KEY);

    expect(mockStore.patchState).toHaveBeenCalledWith(
      jasmine.objectContaining({
        cocktails: savedState.cocktails,
        lastSearchTerm: savedState.term,
      }),
    );

    expect(mockStore.startLoading).not.toHaveBeenCalled();
    expect(mockCocktailService.searchByName).not.toHaveBeenCalled();
  });

  it('should handle search error', fakeAsync(() => {
    fixture.detectChanges();
    tick(300);

    // Configurar el mock para que falle
    mockCocktailService.searchByName.and.returnValue(throwError(() => new Error('fail')));
    spyOn(console, 'error');

    component.performSearch({ type: 'name', value: 'fail' });
    tick(300);

    expect(mockStore.setError).toHaveBeenCalled();
    expect(localStorage.removeItem).toHaveBeenCalledWith(SEARCH_STATE_KEY);
  }));

  it('should call correct search method (selectSearchMethod)', () => {
    component['selectSearchMethod']({ type: 'name', value: 'x' }).subscribe();
    expect(mockCocktailService.searchByName).toHaveBeenCalledWith('x');

    component['selectSearchMethod']({ type: 'ingredient', value: 'y' }).subscribe();
    expect(mockCocktailService.searchByIngredient).toHaveBeenCalledWith('y');

    component['selectSearchMethod']({ type: 'id', value: 'z' }).subscribe();
    expect(mockCocktailService.searchById).toHaveBeenCalledWith('z');
  });

  it('should toggle favorite filter', () => {
    component.toggleFavoriteFilter();
    expect(mockStore.toggleFilterFavorites).toHaveBeenCalled();
  });

  // --- Pruebas de Scroll ---

  it('should restore scroll position', fakeAsync(() => {
    sessionStorageStore[SCROLL_POSITION_KEY] = '200';

    component.ngAfterViewInit();

    tick(0);

    expect(component.scrollContainerRef.nativeElement.scrollTop).toBe(200);
  }));

  it('should save scroll position', () => {
    component.scrollContainerRef.nativeElement.scrollTop = 150;

    component['_saveScrollPosition']();

    expect(sessionStorage.setItem).toHaveBeenCalledWith(SCROLL_POSITION_KEY, '150');
  });
});

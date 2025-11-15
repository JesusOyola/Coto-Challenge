import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CocktailDetailComponent } from './cocktail-detail.component';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CocktailService } from '../../services/cocktail.service';
import { DrinkApiResponse, Drink } from '../../models/cocktail.interface';
import { Location } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockLocation {
  back = jasmine.createSpy('back');
}

describe('CocktailDetailComponent', () => {
  let component: CocktailDetailComponent;
  let fixture: ComponentFixture<CocktailDetailComponent>;
  let cocktailService: jasmine.SpyObj<CocktailService>;
  let mockLocation: MockLocation;

  const mockDrink: Drink = {
    idDrink: '11000',
    strDrink: 'Mojito',
    strInstructions: 'Mix all ingredients',
    strIngredient1: 'Rum',
    strMeasure1: '2 oz',
    strIngredient2: 'Mint',
    strMeasure2: '10 leaves',
    strIngredient3: null,
    strMeasure3: '1 tsp',
  } as unknown as Drink;

  const mockResponse: DrinkApiResponse = { drinks: [mockDrink] };

  beforeEach(async () => {
    const cocktailServiceSpy = jasmine.createSpyObj('CocktailService', ['searchById']);

    await TestBed.configureTestingModule({
      imports: [
        CocktailDetailComponent,
        MatProgressSpinnerModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
      ],
      providers: [
        { provide: CocktailService, useValue: cocktailServiceSpy },
        { provide: Location, useClass: MockLocation }, // Usar el mock
        {
          provide: ActivatedRoute,
          useValue: {
            // Simular un ID de ruta
            params: of({ id: '11000' }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailDetailComponent);
    component = fixture.componentInstance;
    cocktailService = TestBed.inject(CocktailService) as jasmine.SpyObj<CocktailService>;
    mockLocation = TestBed.inject(Location) as unknown as MockLocation;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cocktail detail on ngOnInit', fakeAsync(() => {
    cocktailService.searchById.and.returnValue(of(mockResponse));

    component.ngOnInit();
    tick(); // Procesar el observable de la ruta y la llamada al servicio

    expect(component.isLoading()).toBeFalse();
    expect(component.cocktailDetail()).toEqual(mockDrink);
  }));

  it('should set error if ID is not provided in route params', () => {
    // Reconfigurar ActivatedRoute para que no tenga ID
    TestBed.inject(ActivatedRoute).params = of({});

    component.ngOnInit();

    expect(component.error()).toEqual('ID de cóctel no proporcionado.');
    expect(cocktailService.searchById).not.toHaveBeenCalled();
  });

  it('should set error state if API call fails', fakeAsync(() => {
    cocktailService.searchById.and.returnValue(throwError(() => new Error('Network Error')));

    component.ngOnInit();
    tick();

    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toEqual('Error al cargar los detalles del cóctel.');
  }));

  it('should set error if API returns null drinks (not found)', fakeAsync(() => {
    cocktailService.searchById.and.returnValue(of({ drinks: null }));

    component.ngOnInit();
    tick();

    expect(component.cocktailDetail()).toBeNull();
    expect(component.error()).toEqual('No se encontró el cóctel con el ID proporcionado.');
  }));

  it('should correctly compute the ingredients list, ignoring nulls and empty measures', () => {
    component.cocktailDetail.set(mockDrink);

    const ingredients = component.ingredientsList();

    expect(ingredients.length).toBe(2);
    expect(ingredients).toEqual([
      { measure: '2 oz', ingredient: 'Rum' },
      { measure: '10 leaves', ingredient: 'Mint' },
    ]);
  });

  it('should call location.back() when goBack is called', () => {
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('should unsubscribe from routeSubscription on destroy', () => {
    // Usamos el ngOnInit del test anterior para asegurar que la subscripción existe
    cocktailService.searchById.and.returnValue(of(mockResponse));
    component.ngOnInit();

    const sub = (component as unknown as { routeSubscription: { unsubscribe: jasmine.Spy } })
      .routeSubscription;
    spyOn(sub, 'unsubscribe');

    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
});

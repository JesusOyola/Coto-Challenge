import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CocktailService } from './cocktail.service';
import { DrinkApiResponse, IngredientApiResponse } from '../models/cocktail.interface';
import { provideHttpClient } from '@angular/common/http';

describe('CocktailService', () => {
  let service: CocktailService;
  let controller: HttpTestingController;
  const baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';

  const mockDrinkResponse: DrinkApiResponse = {
    drinks: [
      { idDrink: '11000', strDrink: 'Mocktail', strInstructions: '', strIngredient1: 'Vodka' },
    ] as unknown as DrinkApiResponse['drinks'],
  };

  const mockIngredientResponse: IngredientApiResponse = {
    drinks: [
      { strDrink: 'Vodka Martini', strDrinkThumb: '', idDrink: '10001' },
    ] as IngredientApiResponse['drinks'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CocktailService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call searchByName with correct URL and "s" query parameter', () => {
    const searchTerm = 'margarita';

    service.searchByName(searchTerm).subscribe((res) => {
      expect(res).toEqual(mockDrinkResponse);
    });

    const req = controller.expectOne(`${baseUrl}search.php?s=${searchTerm}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDrinkResponse);
  });

  it('should handle API returning null drinks (no data found) for searchByName', () => {
    const searchTerm = 'nonexistent';
    const noDataResponse: DrinkApiResponse = { drinks: null };

    service.searchByName(searchTerm).subscribe((res) => {
      expect(res.drinks).toBeNull();
      expect(res).toEqual(noDataResponse);
    });

    const req = controller.expectOne(`${baseUrl}search.php?s=${searchTerm}`);
    req.flush(noDataResponse);
  });

  it('should call searchByIngredient with correct URL and "i" query parameter', () => {
    const ingredient = 'Gin';

    service.searchByIngredient(ingredient).subscribe((res) => {
      expect(res).toEqual(mockIngredientResponse);
    });

    const req = controller.expectOne(`${baseUrl}filter.php?i=${ingredient}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockIngredientResponse);
  });

  it('should call searchById with correct URL and "i" query parameter', () => {
    const id = '12345';

    service.searchById(id).subscribe((res) => {
      expect(res).toEqual(mockDrinkResponse);
    });

    const req = controller.expectOne(`${baseUrl}lookup.php?i=${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDrinkResponse);
  });

  it('should handle network error for searchByName', () => {
    const searchTerm = 'error';
    const mockError = new ProgressEvent('error');

    service.searchByName(searchTerm).subscribe({
      next: () => fail('expected an error, not drinks'),
      error: (error) => {
        expect(error.status).toBe(0);
      },
    });

    const req = controller.expectOne(`${baseUrl}search.php?s=${searchTerm}`);
    req.error(mockError);
  });
});

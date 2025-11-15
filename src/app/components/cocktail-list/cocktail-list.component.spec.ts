import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatGridListModule } from '@angular/material/grid-list';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CocktailListComponent } from './cocktail-list.component';
import { Drink } from '../../models/cocktail.interface';

// ---- Mock Components Hijos ----
@Component({
  selector: 'app-cocktail-card',
  template: '',
  standalone: true,
})
class MockCocktailCardComponent {
  @Input() cocktail!: Drink;
}

@Component({
  selector: 'app-cocktail-card-skeleton',
  template: '',
  standalone: true,
})
class MockCocktailCardSkeletonComponent {}

describe('CocktailListComponent', () => {
  let component: CocktailListComponent;
  let fixture: ComponentFixture<CocktailListComponent>;

  const mockCocktails: Drink[] = [
    {
      idDrink: '1',
      strDrink: 'Margarita',
      strDrinkThumb: 'url1',
      strAlcoholic: 'Alcoholic',
      strGlass: 'Cocktail glass',
      strCategory: 'Cocktail',
      strInstructions: '',
    },
    {
      idDrink: '2',
      strDrink: 'Mojito',
      strDrinkThumb: 'url2',
      strAlcoholic: 'Alcoholic',
      strGlass: 'Highball glass',
      strCategory: 'Cocktail',
      strInstructions: '',
    },
  ] as Drink[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CocktailListComponent,
        MatGridListModule,
        MockCocktailCardComponent,
        MockCocktailCardSkeletonComponent,
      ],
      providers: [{ provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailListComponent);
    component = fixture.componentInstance;
    // Mock de datos
    component.cocktails = [
      { idDrink: '1', strDrink: 'Mocktail' } as unknown as Drink,
      { idDrink: '2', strDrink: 'Mocktail 2' } as unknown as Drink,
    ];

    component.isLoading = false; // Para test de cards
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cocktail cards when isLoading is false', () => {
    component.isLoading = false;
    component.cocktails = mockCocktails;
    fixture.detectChanges();

    const cocktailElements = fixture.debugElement.queryAll(By.css('app-cocktail-card'));
    const skeletonElements = fixture.debugElement.queryAll(By.css('app-cocktail-card-skeleton'));

    expect(cocktailElements.length).toBe(mockCocktails.length);
    expect(skeletonElements.length).toBe(0);
    expect(cocktailElements[0].componentInstance.cocktail.strDrink).toBe('Margarita');
  });
});

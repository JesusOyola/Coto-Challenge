import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

import { CocktailCardComponent } from './cocktail-card.component';
import { Drink } from '../../models/cocktail.interface';
import { CocktailStore } from '../../store/cocktail.store';

const mockDrink: Drink = {
  idDrink: '11007',
  strDrink: 'Margarita',
  strAlcoholic: 'Alcoholic',
  strCategory: 'Ordinary Drink',
  strDrinkThumb: 'url',
  strGlass: 'Cocktail glass',
} as Drink;

// Mock OverlayRef
const mockOverlayRef: OverlayRef = {
  hasAttached: () => false,
  attach: jasmine.createSpy('attach'),
  dispose: jasmine.createSpy('dispose'),
  backdropClick: () => new Subject(),
} as unknown as OverlayRef;

const mockOverlay: Overlay = {
  create: jasmine.createSpy('create').and.returnValue(mockOverlayRef),
  scrollStrategies: {
    reposition: () => ({
      enable: () => null,
      disable: () => null,
    }),
    close: () => ({ reposition: () => null }),
    block: () => ({}),
    noop: () => ({}),
  },
} as unknown as Overlay;

const mockStore = {
  isFavorite: () => () => false,
  toggleFavorite: jasmine.createSpy('toggleFavorite'),
};

describe('CocktailCardComponent', () => {
  let component: CocktailCardComponent;
  let fixture: ComponentFixture<CocktailCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocktailCardComponent, MatCardModule, MatButtonModule],
      providers: [
        { provide: Overlay, useValue: mockOverlay },
        { provide: CocktailStore, useValue: mockStore },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}) } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailCardComponent);
    component = fixture.componentInstance;
    component.cocktail = mockDrink;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispose overlay on destroy', () => {
    component['overlayRef'] = mockOverlayRef;
    component.ngOnDestroy();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  it('should not throw if overlayRef is null on destroy', () => {
    component['overlayRef'] = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});

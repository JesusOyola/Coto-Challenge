import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CocktailCardSkeletonComponent } from './cocktail-card-skeleton.component';

describe('CocktailCardSkeletonComponent', () => {
  let component: CocktailCardSkeletonComponent;
  let fixture: ComponentFixture<CocktailCardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocktailCardSkeletonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CocktailCardSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

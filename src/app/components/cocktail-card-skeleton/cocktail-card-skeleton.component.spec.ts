import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CocktailCardSkeletonComponent } from './cocktail-card-skeleton.component';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';

describe('CocktailCardSkeletonComponent', () => {
  let component: CocktailCardSkeletonComponent;
  let fixture: ComponentFixture<CocktailCardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocktailCardSkeletonComponent, MatCardModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailCardSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the skeleton component', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-card with skeleton classes', () => {
    const matCard = fixture.debugElement.query(By.css('mat-card'));
    expect(matCard).toBeTruthy();

    const skeletonImage = matCard.query(By.css('.skeleton-image'));
    expect(skeletonImage).toBeTruthy();

    const skeletonTitle = matCard.query(By.css('.skeleton-title-line'));
    expect(skeletonTitle).toBeTruthy();

    const skeletonActions = matCard.query(By.css('.skeleton-actions'));
    expect(skeletonActions).toBeTruthy();
  });
});

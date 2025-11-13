import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Drink, IngredientDetail } from '../../models/cocktail.interface';
import { Subscription, map } from 'rxjs';
import { CocktailService } from '../../services/cocktail.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-cocktail-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './cocktail-detail.component.html',
  styleUrl: './cocktail-detail.component.scss',
})
export class CocktailDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private cocktailService = inject(CocktailService);

  public cocktailDetail = signal<Drink | null>(null);
  public isLoading = signal(false);
  public error = signal<string | null>(null);

  private routeSubscription!: Subscription;

  // Genera el array limpio de ingredientes
  public ingredientsList = computed(() => {
    const cocktail = this.cocktailDetail();
    if (!cocktail) {
      return [];
    }

    const ingredients: IngredientDetail[] = [];

    for (let i = 1; i <= 15; i++) {
      const ingredientKey = ('strIngredient' + i) as keyof Drink;
      const measureKey = ('strMeasure' + i) as keyof Drink;

      const ingredient = cocktail[ingredientKey];
      const measure = cocktail[measureKey];

      if (ingredient && typeof ingredient === 'string' && ingredient.trim().length > 0) {
        ingredients.push({
          measure: measure && typeof measure === 'string' ? measure.trim() : '',
          ingredient: ingredient.trim(),
        });
      }
    }
    return ingredients;
  });

  ngOnInit(): void {
    this.routeSubscription = this.route.params
      .pipe(map((params) => params['id']))
      .subscribe((id) => {
        if (id) {
          this.loadCocktailDetail(id);
        } else {
          this.error.set('ID de cóctel no proporcionado.');
        }
      });
  }

  private loadCocktailDetail(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.cocktailDetail.set(null);

    this.cocktailService.searchById(id).subscribe({
      next: (response) => {
        const cocktail = response.drinks ? response.drinks[0] : null;
        this.cocktailDetail.set(cocktail);
        this.isLoading.set(false);
        if (!cocktail) {
          this.error.set('No se encontró el cóctel con el ID proporcionado.');
        }
      },
      error: () => {
        this.error.set('Error al cargar los detalles del cóctel.');
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}

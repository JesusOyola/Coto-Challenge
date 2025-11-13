import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cocktail-card-skeleton',
  imports: [CommonModule, MatCardModule],
  templateUrl: './cocktail-card-skeleton.component.html',
  styleUrl: './cocktail-card-skeleton.component.scss'
})
export class CocktailCardSkeletonComponent {

}

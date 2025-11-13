import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CocktailCardComponent } from '../cocktail-card/cocktail-card.component';
import { MatGridListModule } from '@angular/material/grid-list';

import { Drink } from '../../models/cocktail.interface';

@Component({
  selector: 'app-cocktail-list',
  imports: [CommonModule, MatGridListModule, CocktailCardComponent],
  templateUrl: './cocktail-list.component.html',
  styleUrls: ['./cocktail-list.component.scss'],
})
export class CocktailListComponent {
  @Input() cocktails: Drink[] = [];
  @Input() isLoading = false;
}

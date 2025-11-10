import { Drink } from '../../models/cocktail.interface';

export interface CocktailState {
  cocktails: Drink[];
  favorites: Drink[];
  isLoading: boolean;
  error: string | null;
  lastSearchTerm: string;
  filterOnlyFavorites: boolean;
}

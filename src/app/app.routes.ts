import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },

  {
    path: 'detail/:id',

    loadComponent: () =>
      import('./pages/cocktail-detail/cocktail-detail.component').then(
        (m) => m.CocktailDetailComponent,
      ),
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

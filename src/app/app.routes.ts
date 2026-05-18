import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'categories', pathMatch: 'full' },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories').then((m) => m.CategoriesPage),
  },
  {
    path: 'recipes',
    loadComponent: () =>
      import('./pages/recipes/recipes').then((m) => m.RecipesPage),
  },
  {
    path: 'recipes/create',
    loadComponent: () =>
      import('./pages/recipe-create/recipe-create').then((m) => m.RecipeCreatePage),
  },
];

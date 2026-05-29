import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage),
  },
  {
    path: 'auth/pending',
    loadComponent: () => import('./pages/auth-pending/auth-pending').then(m => m.AuthPendingPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/categories/categories').then(m => m.CategoriesPage),
    canActivate: [authGuard],
  },
  {
    path: 'recipes',
    loadComponent: () => import('./pages/recipes/recipes').then(m => m.RecipesPage),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/create',
    loadComponent: () => import('./pages/recipe-create/recipe-create').then(m => m.RecipeCreatePage),
    canActivate: [authGuard],
  },
  {
    path: 'access-requests',
    loadComponent: () => import('./pages/access-requests/access-requests').then(m => m.AccessRequestsPage),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () => import('./pages/recipe-edit/recipe-edit').then(m => m.RecipeEditPage),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./pages/recipe-view/recipe-view').then(m => m.RecipeViewPage),
    canActivate: [authGuard],
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () => import('./pages/category-edit/category-edit').then(m => m.CategoryEditPage),
    canActivate: [authGuard],
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden/forbidden').then(m => m.ForbiddenPage),
  },
  { path: '**', redirectTo: 'dashboard' },
];

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Recipe, RecipeListResponse, RecipeDeletePreview,
  RecipeDetail, RecipeFullUpdate,
  IngredientRef, ItemRef,
} from '../models/recipe.model';
import { RecipeDraft } from '../models/parser.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/recipes`;

  getRecipes(params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    category?: string;
    difficulty?: string;
    tag?: string;
  }): Observable<RecipeListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.difficulty) httpParams = httpParams.set('difficulty', params.difficulty);
    if (params.tag) httpParams = httpParams.set('tag', params.tag);
    return this.http.get<RecipeListResponse>(this.baseUrl, { params: httpParams });
  }

  getRecipe(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.baseUrl}/${id}`);
  }

  getRecipeDetail(id: string): Observable<RecipeDetail> {
    return this.http.get<RecipeDetail>(`${this.baseUrl}/${id}/detail`);
  }

  updateRecipe(id: string, data: Partial<Recipe>): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.baseUrl}/${id}`, data);
  }

  updateRecipeFull(id: string, data: RecipeFullUpdate): Observable<RecipeDetail> {
    return this.http.put<RecipeDetail>(`${this.baseUrl}/${id}/full`, data);
  }

  getDeletePreview(id: string): Observable<RecipeDeletePreview> {
    return this.http.get<RecipeDeletePreview>(`${this.baseUrl}/${id}/delete-preview`);
  }

  deleteRecipe(id: string): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(`${this.baseUrl}/${id}`);
  }

  createRecipe(draft: RecipeDraft): Observable<{ id: string; status: string }> {
    return this.http.post<{ id: string; status: string }>(this.baseUrl, draft);
  }

  getAllIngredients(): Observable<{ items: IngredientRef[] }> {
    return this.http.get<{ items: IngredientRef[] }>(`${this.baseUrl}/ingredients`);
  }

  getAllItems(): Observable<{ items: ItemRef[] }> {
    return this.http.get<{ items: ItemRef[] }>(`${this.baseUrl}/items`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryListResponse, CategoryDeletePreview } from '../models/category.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  getCategories(params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Observable<CategoryListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.page_size) httpParams = httpParams.set('page_size', params.page_size);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return this.http.get<CategoryListResponse>(this.baseUrl, { params: httpParams });
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  getDeletePreview(id: string): Observable<CategoryDeletePreview> {
    return this.http.get<CategoryDeletePreview>(`${this.baseUrl}/${id}/delete-preview`);
  }

  deleteCategory(id: string): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(`${this.baseUrl}/${id}`);
  }
}

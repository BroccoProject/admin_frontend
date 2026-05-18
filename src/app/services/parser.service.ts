import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParseRequest, ParseResponse, FeedbackRequest } from '../models/parser.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/parser`;

  parseRecipe(text: string): Observable<ParseResponse> {
    const req: ParseRequest = { text };
    return this.http.post<ParseResponse>(this.baseUrl, req);
  }

  provideFeedback(threadId: string, feedback: string): Observable<ParseResponse> {
    const req: FeedbackRequest = { feedback };
    return this.http.post<ParseResponse>(`${this.baseUrl}/${threadId}`, req);
  }
}

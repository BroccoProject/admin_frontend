import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccessRequestListResponse,
  AccessRequest,
  TeamMemberListResponse,
  TeamMember,
} from '../models/user-management.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/access-requests`;

  getAccessRequests(status?: string): Observable<AccessRequestListResponse> {
    let httpParams = new HttpParams();
    if (status) {
      httpParams = httpParams.set('status', status);
    }
    return this.http.get<AccessRequestListResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  approveAccessRequest(id: string): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectAccessRequest(id: string): Observable<AccessRequest> {
    return this.http.patch<AccessRequest>(`${this.baseUrl}/${id}/reject`, {});
  }

  getTeamMembers(): Observable<TeamMemberListResponse> {
    return this.http.get<TeamMemberListResponse>(`${this.baseUrl}/team`);
  }

  updateTeamMemberRole(id: string, role: string): Observable<TeamMember> {
    return this.http.patch<TeamMember>(`${this.baseUrl}/team/${id}/role`, {
      role,
    });
  }

  deleteTeamMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/team/${id}`);
  }
}

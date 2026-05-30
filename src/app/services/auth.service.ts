import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly user = signal<AuthUser | null>(null);
  private readonly _loading = signal(false);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isEditor = computed(() => 
    this.user()?.role === 'admin' || this.user()?.role === 'editor'
  );
  readonly isViewer = computed(() => this.user()?.role === 'viewer');
  readonly loading = this._loading.asReadonly();

  private readonly apiUrl = 'http://localhost:8000/api/v1';

  async loadUser(): Promise<AuthUser | null> {
    this._loading.set(true);
    try {
      const user = await firstValueFrom(
        this.http.get<AuthUser>(`${this.apiUrl}/auth/me`, { withCredentials: true })
      );
      this.user.set(user);
      return user;
    } catch (error) {
      this.user.set(null);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  login(): void {
    this.loginWithGoogle();
  }

  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  loginWithGithub(): void {
    window.location.href = `${this.apiUrl}/auth/github`;
  }

  async loginWithCredentials(email: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
    );
    await this.loadUser();
    this.router.navigate(['/dashboard']);
  }

  async register(email: string, password: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ detail: string }>(`${this.apiUrl}/auth/register`, { email, password })
    );
    return response.detail;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/auth/session`, { withCredentials: true })
      );
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      this.user.set(null);
      this.router.navigate(['/login']);
    }
  }

  async initialize(): Promise<void> {
    await this.loadUser();
  }
}

import { Component, inject, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-pending.html',
  styleUrl: '../login/login.scss',
})
export class AuthPendingPage {
  protected readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  
  readonly status = computed(() => this.authService.currentUser()?.access_status ?? 'not_registered');

  isRequesting = false;

  async requestAccess() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    this.isRequesting = true;
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/access-requests`, {
          email: user.email,
          message: 'Please grant me access to the admin panel.'
        }, { withCredentials: true })
      );
      await this.authService.loadUser();
    } catch (error) {
      console.error('Failed to request access', error);
    } finally {
      this.isRequesting = false;
    }
  }
}

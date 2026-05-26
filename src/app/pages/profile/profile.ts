import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  user = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }

  getRoleLabel(role: string | undefined): string {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      default: return 'Unknown';
    }
  }
}

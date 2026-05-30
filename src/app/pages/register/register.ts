import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: '../login/login.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showPassword = signal(false);

  passwordsMatch = computed(() => this.password() === this.confirmPassword());

  async register() {
    if (!this.passwordsMatch()) {
      this.error.set("Passwords do not match");
      return;
    }
    if (this.password().length < 8) {
      this.error.set("Password must be at least 8 characters");
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const msg = await this.authService.register(this.email(), this.password());
      this.success.set(msg);
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

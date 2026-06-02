import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  async ngOnInit() {
    const user = await this.authService.loadUser();
    if (user) {
      this.router.navigate(['/dashboard']);
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  loginWithGithub() {
    this.authService.loginWithGithub();
  }

  async loginWithEmail() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithCredentials(this.email(), this.password());
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Invalid email or password');
    } finally {
      this.loading.set(false);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}

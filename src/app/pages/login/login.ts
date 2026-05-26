import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit() {
    const user = await this.authService.loadUser();
    if (user) {
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    this.authService.login();
  }
}

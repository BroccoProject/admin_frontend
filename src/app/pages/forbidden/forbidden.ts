import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  templateUrl: './forbidden.html',
  styles: [`
    .forbidden-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f8f9fa;
      text-align: center;
    }
    .forbidden-card {
      background: white;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .forbidden-card h1 {
      color: #dc3545;
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .back-button {
      margin-top: 2rem;
      padding: 0.5rem 1.5rem;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .back-button:hover {
      background-color: #5a6268;
    }
  `]
})
export class ForbiddenPage {
  private readonly router = inject(Router);

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}

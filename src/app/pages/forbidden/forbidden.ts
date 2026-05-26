import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.scss',
})
export class ForbiddenPage {
  private readonly router = inject(Router);
  goBack() { this.router.navigate(['/dashboard']); }
}

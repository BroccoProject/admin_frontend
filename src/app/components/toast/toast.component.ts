import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
    }
    .toast {
      padding: 1rem 1.5rem;
      border-radius: 4px;
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 300px;
    }
    .toast.success {
      background-color: #28a745;
    }
    .toast.error {
      background-color: #dc3545;
    }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      margin-left: 1rem;
    }
    @media (max-width: 480px) {
      .toast-container {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
      }
      .toast {
        min-width: 0;
        width: 100%;
        padding: 0.75rem 1rem;
      }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}

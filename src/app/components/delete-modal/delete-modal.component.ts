import { Component, input, output } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-delete-modal',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  templateUrl: './delete-modal.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-cancel {
      background-color: #6c757d;
      color: white;
    }
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .preview-box {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .warning {
      color: #dc3545;
      font-weight: bold;
      margin: 1rem 0;
    }
    .spinner {
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      border: 3px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      border-top-color: #007bff;
      animation: spin 1s ease-in-out infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 480px) {
      .modal-content {
        padding: 1.25rem;
      }
      .modal-actions {
        flex-direction: column;
        gap: 0.5rem;
      }
      .btn {
        width: 100%;
      }
    }
  `]
})
export class DeleteModalComponent {
  visible = input.required<boolean>();
  itemName = input.required<string>();
  preview = input<any | null>(null);
  previewLoading = input<boolean>(false);
  deleting = input<boolean>(false);
  blocked = input<boolean>(false);
  
  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    if (!this.blocked() && !this.deleting()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.deleting()) {
      this.cancelled.emit();
    }
  }
}

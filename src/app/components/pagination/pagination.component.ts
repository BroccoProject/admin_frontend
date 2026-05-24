import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }
    .pagination-info {
      color: #6c757d;
    }
    .pagination-controls {
      display: flex;
      gap: 0.25rem;
    }
    .btn-page {
      padding: 0.375rem 0.75rem;
      border: 1px solid #dee2e6;
      background-color: white;
      color: #007bff;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn-page:hover:not(:disabled) {
      background-color: #e9ecef;
    }
    .btn-page.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
    .btn-page:disabled {
      color: #6c757d;
      cursor: not-allowed;
      background-color: #f8f9fa;
    }
  `]
})
export class PaginationComponent {
  page = input.required<number>();
  totalPages = input.required<number>();
  total = input.required<number>();
  pageSize = input.required<number>();

  pageChange = output<number>();

  paginationInfo = computed(() => {
    const t = this.total();
    const p = this.page();
    const ps = this.pageSize();
    const from = t === 0 ? 0 : (p - 1) * ps + 1;
    const to = Math.min(p * ps, t);
    return `Showing ${from} to ${to} of ${t} items`;
  });

  pageNumbers = computed(() => {
    const tp = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(tp, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.pageChange.emit(p);
  }
}

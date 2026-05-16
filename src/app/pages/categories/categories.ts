import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryDeletePreview } from '../../models/category.model';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class CategoriesPage implements OnInit {
  private readonly categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  searchQuery = signal('');
  sortBy = signal('title');
  sortOrder = signal<'asc' | 'desc'>('asc');
  loading = signal(false);

  // Delete modal state
  showDeleteModal = signal(false);
  categoryToDelete = signal<Category | null>(null);
  deleting = signal(false);
  deletePreview = signal<CategoryDeletePreview | null>(null);
  previewLoading = signal(false);

  // Result toast state
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  paginationInfo = computed(() => {
    const t = this.total();
    const p = this.page();
    const ps = this.pageSize();
    const from = t === 0 ? 0 : (p - 1) * ps + 1;
    const to = Math.min(p * ps, t);
    return `Showing ${from} to ${to} of ${t} categories`;
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

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService
      .getCategories({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
        sort_by: this.sortBy(),
        sort_order: this.sortOrder(),
      })
      .subscribe({
        next: (res) => {
          this.categories.set(res.items);
          this.total.set(res.total);
          this.totalPages.set(res.total_pages);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showToastMessage('Failed to load categories', 'error');
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadCategories();
  }

  onSortChange(field: string): void {
    this.sortBy.set(field);
    this.page.set(1);
    this.loadCategories();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadCategories();
  }

  // Delete flow
  confirmDelete(category: Category): void {
    this.categoryToDelete.set(category);
    this.deletePreview.set(null);
    this.previewLoading.set(true);
    this.showDeleteModal.set(true);

    this.categoryService.getDeletePreview(category.id).subscribe({
      next: (preview) => {
        this.deletePreview.set(preview);
        this.previewLoading.set(false);
      },
      error: () => {
        // Non-fatal: modal still opens but without preview stats
        this.previewLoading.set(false);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.categoryToDelete.set(null);
    this.deletePreview.set(null);
  }

  executeDelete(): void {
    const cat = this.categoryToDelete();
    if (!cat) return;

    this.deleting.set(true);
    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.categoryToDelete.set(null);
        this.deletePreview.set(null);
        this.showToastMessage('Category deleted successfully!', 'success');
        this.loadCategories();
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.categoryToDelete.set(null);
        this.deletePreview.set(null);
        const message =
          err?.error?.detail ||
          'An unexpected error occurred while deleting the category.';
        this.showToastMessage(message, 'error');
      },
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}

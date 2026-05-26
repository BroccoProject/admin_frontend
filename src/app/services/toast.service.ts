import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _visible = signal(false);
  private readonly _message = signal('');
  private readonly _type = signal<'success' | 'error'>('success');
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly visible = this._visible.asReadonly();
  readonly message = this._message.asReadonly();
  readonly type = this._type.asReadonly();

  show(message: string, type: 'success' | 'error' = 'success', duration = 4000): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this._message.set(message);
    this._type.set(type);
    this._visible.set(true);
    this.timeoutId = setTimeout(() => this._visible.set(false), duration);
  }

  hide(): void {
    this._visible.set(false);
  }
}

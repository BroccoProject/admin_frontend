import { Directive, Input, ElementRef, Renderer2, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({ selector: '[disabledNoRole]', standalone: true })
export class DisabledNoRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input() set disabledNoRole(role: 'admin' | 'editor') {
    const allowed = role === 'editor'
      ? this.authService.isEditor()
      : this.authService.isAdmin();

    if (!allowed) {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
      this.renderer.setAttribute(this.el.nativeElement, 'title', "You don't have permission to perform this action");
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.5');
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'not-allowed');
    }
  }
}

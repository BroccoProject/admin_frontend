import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef);

  @Input() set hasRole(role: 'admin' | 'editor') {
    const allowed = role === 'editor'
      ? this.authService.isEditor()
      : this.authService.isAdmin();
      
    this.vcr.clear();
    if (allowed) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}

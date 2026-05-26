import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManagementService } from '../../services/user-management.service';
import { AccessRequest, TeamMember } from '../../models/user-management.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-access-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './access-requests.html',
  styleUrl: './access-requests.scss',
})
export class AccessRequestsPage implements OnInit {
  private readonly userService = inject(UserManagementService);
  private readonly toastService = inject(ToastService);

  activeTab = signal<'pending' | 'archived' | 'team'>('pending');

  pendingRequests = signal<AccessRequest[]>([]);
  archivedRequests = signal<AccessRequest[]>([]);
  teamMembers = signal<TeamMember[]>([]);

  searchQuery = signal('');

  loading = signal(false);
  actionLoading = signal(false);

  showRoleModal = signal(false);
  selectedMemberForRole = signal<TeamMember | null>(null);
  selectedRole = signal<'admin' | 'editor'>('editor');

  showRevokeModal = signal(false);
  selectedMemberForRevoke = signal<TeamMember | null>(null);

  filteredPending = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const reqs = this.pendingRequests();
    if (!query) return reqs;
    return reqs.filter((r) => r.email.toLowerCase().includes(query));
  });

  filteredArchived = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const reqs = this.archivedRequests();
    if (!query) return reqs;
    return reqs.filter(
      (r) =>
        r.email.toLowerCase().includes(query) ||
        (r.message && r.message.toLowerCase().includes(query))
    );
  });

  filteredTeam = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const members = this.teamMembers();
    if (!query) return members;
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  setTab(tab: 'pending' | 'archived' | 'team'): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const tab = this.activeTab();

    if (tab === 'pending') {
      this.userService.getAccessRequests('pending').subscribe({
        next: (res) => {
          this.pendingRequests.set(res.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.show(
            err?.error?.detail || 'Failed to load pending requests',
            'error'
          );
        },
      });
    } else if (tab === 'archived') {
      this.userService.getAccessRequests().subscribe({
        next: (res) => {
          const nonPending = res.items.filter((r) => r.status !== 'pending');
          this.archivedRequests.set(nonPending);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.show(
            err?.error?.detail || 'Failed to load archived requests',
            'error'
          );
        },
      });
    } else if (tab === 'team') {
      this.userService.getTeamMembers().subscribe({
        next: (res) => {
          this.teamMembers.set(res.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.show(
            err?.error?.detail || 'Failed to load team members',
            'error'
          );
        },
      });
    }
  }

  approveRequest(request: AccessRequest): void {
    this.actionLoading.set(true);
    this.userService.approveAccessRequest(request.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toastService.show(
          `Request for ${request.email} approved successfully!`,
          'success'
        );
        this.loadData();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.show(
          err?.error?.detail || 'Failed to approve request',
          'error'
        );
      },
    });
  }

  rejectRequest(request: AccessRequest): void {
    this.actionLoading.set(true);
    this.userService.rejectAccessRequest(request.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toastService.show(
          `Request for ${request.email} has been rejected.`,
          'success'
        );
        this.loadData();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.show(
          err?.error?.detail || 'Failed to reject request',
          'error'
        );
      },
    });
  }

  openRoleModal(member: TeamMember): void {
    this.selectedMemberForRole.set(member);
    this.selectedRole.set(member.role);
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
    this.selectedMemberForRole.set(null);
  }

  saveRoleChange(): void {
    const member = this.selectedMemberForRole();
    if (!member) return;

    this.actionLoading.set(true);
    this.userService
      .updateTeamMemberRole(member.id, this.selectedRole())
      .subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.closeRoleModal();
          this.toastService.show(
            `Role updated for ${member.email} successfully.`,
            'success'
          );
          this.loadData();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toastService.show(
            err?.error?.detail || 'Failed to update user role',
            'error'
          );
        },
      });
  }

  openRevokeModal(member: TeamMember): void {
    this.selectedMemberForRevoke.set(member);
    this.showRevokeModal.set(true);
  }

  closeRevokeModal(): void {
    this.showRevokeModal.set(false);
    this.selectedMemberForRevoke.set(null);
  }

  executeRevoke(): void {
    const member = this.selectedMemberForRevoke();
    if (!member) return;

    this.actionLoading.set(true);
    this.userService.deleteTeamMember(member.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeRevokeModal();
        this.toastService.show(
          `Access revoked for ${member.email} successfully.`,
          'success'
        );
        this.loadData();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.show(
          err?.error?.detail || 'Failed to revoke user access',
          'error'
        );
      },
    });
  }
}

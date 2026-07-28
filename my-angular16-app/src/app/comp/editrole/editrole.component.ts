import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-editrole',
  templateUrl: './editrole.component.html',
  styleUrls: ['./editrole.component.css']
})
export class EditroleComponent implements OnInit {
  users:          any[]    = [];
  availableRoles: string[] = ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER', 'ATTENDANT', 'FINANCE', 'DRIVER', 'USER'];

  selectedUserId: number | null = null;
  userSearch = '';

  formData = { username: '', email: '', role: '', isActive: true };

  loading  = true;
  saving   = false;
  success  = '';
  error    = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.api.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.route.paramMap.subscribe(params => {
          const routeId    = Number(params.get('id'));
          const hasValidId = Number.isFinite(routeId) && routeId > 0;
          this.selectedUserId = hasValidId
            ? routeId
            : (this.userId(this.users[0]) ?? null);
          this.loadUser();
        });
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.message || 'Failed to load users.';
      }
    });
  }

  private userId(u: any): number | null {
    return u ? (u.userId ?? u.id ?? null) : null;
  }

  loadUser(): void {
    this.success = '';
    this.error   = '';

    if (this.selectedUserId == null) { this.loading = false; return; }

    const user = this.users.find(u => this.userId(u) === this.selectedUserId);

    if (!user) {
      this.error   = 'User not found.';
      this.loading = false;
      return;
    }

    this.formData = {
      username: user.username ?? user.name ?? '',
      email:    user.email    ?? '',
      role:     String(user.role ?? 'USER').toUpperCase(),
      isActive: !!user.isActive,
    };
    this.loading = false;
  }

  onUserChange(): void {
    if (this.selectedUserId != null) {
      this.router.navigate(['/editrole', this.selectedUserId]);
    }
  }

  handleSubmit(): void {
    if (this.selectedUserId == null || !this.formData.role) return;

    this.saving  = true;
    this.success = '';
    this.error   = '';

    forkJoin({
      role:   this.api.updateUserRole(this.selectedUserId, this.formData.role),
      active: this.api.updateUserActive(this.selectedUserId, this.formData.isActive).pipe(catchError(() => of(null))),
    }).subscribe({
      next: () => {
        this.saving  = false;
        this.success = 'User updated successfully.';

        const idx = this.users.findIndex(u => this.userId(u) === this.selectedUserId);
        if (idx > -1) {
          this.users[idx] = {
            ...this.users[idx],
            role:     this.formData.role,
            isActive: this.formData.isActive,
          };
        }
      },
      error: (err) => {
        this.saving = false;
        this.error  = err?.error?.message || 'Failed to update user. Please try again.';
      }
    });
  }

  setRole(role: string): void { this.formData.role = role; }

  roleIcon(role: string): string {
    const icons: Record<string, string> = {
      ADMIN_MAKER:    'fa-shield',
      ADMIN_CHECKER:  'fa-eye',
      MANAGER:        'fa-user-tie',
      ATTENDANT: 'fa-clipboard',
      FINANCE:   'fa-money',
      DRIVER:    'fa-car',
      USER:      'fa-user',
    };
    return icons[role] ?? 'fa-user';
  }

  toggleActive(): void { this.formData.isActive = !this.formData.isActive; }

  get currentUser(): any {
    return this.users.find(u => this.userId(u) === this.selectedUserId);
  }

  get filteredUsers(): any[] {
    const q = this.userSearch.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      (u.username ?? u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }
}

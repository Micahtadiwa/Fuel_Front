import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  users: any[] = [];
  userSearch      = '';
  selectedUserId: number | null = null;
  adminForm = { newPassword: '', confirmPassword: '' };

  saving  = false;
  success = '';
  error   = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getUsers().subscribe({
      next: (users) => { this.users = users; },
      error: () => {}
    });
  }

  get filteredUsers(): any[] {
    const q = this.userSearch.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }

  submitAdmin(): void {
    const { newPassword, confirmPassword } = this.adminForm;
    if (this.selectedUserId == null) {
      this.error = 'Please select a user.'; return;
    }
    if (!newPassword || !confirmPassword) {
      this.error = 'Both password fields are required.'; return;
    }
    if (newPassword !== confirmPassword) {
      this.error = 'Passwords do not match.'; return;
    }
    if (newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.'; return;
    }

    this.saving = true; this.success = ''; this.error = '';
    this.api.resetUserPassword(this.selectedUserId, newPassword).subscribe({
      next: (res) => {
        this.saving  = false;
        this.success = res?.message || 'Password reset successfully.';
        this.adminForm = { newPassword: '', confirmPassword: '' };
        this.selectedUserId = null;
      },
      error: (err) => {
        this.saving = false;
        this.error  = err?.error?.message || 'Failed to reset password.';
      }
    });
  }
}

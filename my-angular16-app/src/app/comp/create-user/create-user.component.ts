import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {
  availableRoles: string[] = ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER', 'ATTENDANT', 'FINANCE', 'DRIVER', 'USER'];

  formData = { name: '', email: '', password: '', role: 'USER' };

  saving  = false;
  success = '';
  error   = '';

  constructor(private api: ApiService, private router: Router) {}

  roleIcon(role: string): string {
    const icons: Record<string, string> = {
      ADMIN_MAKER:   'fa-shield',
      ADMIN_CHECKER: 'fa-eye',
      MANAGER:       'fa-user-tie',
      ATTENDANT:     'fa-clipboard',
      FINANCE:       'fa-money',
      DRIVER:        'fa-car',
      USER:          'fa-user',
    };
    return icons[role] ?? 'fa-user';
  }

  setRole(role: string): void { this.formData.role = role; }

  handleSubmit(): void {
    const { name, email, password, role } = this.formData;
    if (!name || !email || !password || !role) return;

    this.saving  = true;
    this.success = '';
    this.error   = '';

    this.api.adminCreateUser(name, email, password, role).subscribe({
      next: (res) => {
        this.saving  = false;
        this.success = res?.message || 'User created successfully.';
        this.formData = { name: '', email: '', password: '', role: 'USER' };
      },
      error: (err) => {
        this.saving = false;
        this.error  = err?.error?.message || 'Failed to create user. Please try again.';
      }
    });
  }
}

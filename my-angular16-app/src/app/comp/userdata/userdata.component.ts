import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-userdata',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './userdata.component.html',
  styleUrls: ['./userdata.component.css']
})
export class UserdataComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];

  nameFilter   = '';
  roleFilter   = '';
  statusFilter = '';

  stats  = { total: 0, active: 0, inactive: 0 };
  roles: string[] = [];
  statuses = ['Active', 'Inactive'];

  loading = false;
  error   = '';

  page            = 1;
  readonly PAGE_SIZE = 20;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (users) => {
        this.loading = false;
        this.users = users.map((u: any) => ({
          ...u,
          id: u.userId ?? u.id,
          status: u.isActive === true ? 'Active' : 'Inactive'
        }));
        this.roles = [...new Set(this.users.map((u: any) => u.role))];
        this.calculateStats();
        this.filteredUsers = [...this.users];
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load users.';
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      total:    this.users.length,
      active:   this.users.filter(u => u.status === 'Active').length,
      inactive: this.users.filter(u => u.status === 'Inactive').length
    };
  }

  applyFilters(): void {
    this.page = 1;
    this.filteredUsers = this.users.filter(user => {
      const matchesName   = !this.nameFilter   || String(user.username || user.name || '').toLowerCase().includes(this.nameFilter.toLowerCase());
      const matchesRole   = !this.roleFilter   || user.role === this.roleFilter;
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      return matchesName && matchesRole && matchesStatus;
    });
  }

  clearFilters(): void {
    this.nameFilter    = '';
    this.roleFilter    = '';
    this.statusFilter  = '';
    this.page          = 1;
    this.filteredUsers = [...this.users];
  }

  get pagedUsers(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredUsers.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredUsers.length / this.PAGE_SIZE)); }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }
}

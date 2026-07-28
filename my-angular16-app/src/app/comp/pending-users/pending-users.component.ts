import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-pending-users',
  templateUrl: './pending-users.component.html',
  styleUrls: ['./pending-users.component.css']
})
export class PendingUsersComponent implements OnInit {
  users:   any[] = [];
  loading = true;
  error   = '';
  successMsg = '';
  actioningId: number | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.api.getPendingUsers().subscribe({
      next:  (users) => { this.loading = false; this.users = users; },
      error: (err)   => { this.loading = false; this.error = err?.error?.message || 'Failed to load pending users.'; }
    });
  }

  approve(user: any): void {
    const id = user.userId ?? user.id;
    this.actioningId = id; this.successMsg = ''; this.error = '';
    this.api.approveUser(id).subscribe({
      next: (res) => {
        this.actioningId = null;
        this.successMsg  = res?.message || `${user.username} approved.`;
        this.users = this.users.filter(u => (u.userId ?? u.id) !== id);
      },
      error: (err) => { this.actioningId = null; this.error = err?.error?.message || 'Failed to approve.'; }
    });
  }

  reject(user: any): void {
    const id = user.userId ?? user.id;
    this.actioningId = id; this.successMsg = ''; this.error = '';
    this.api.rejectUser(id).subscribe({
      next: (res) => {
        this.actioningId = null;
        this.successMsg  = res?.message || `${user.username} rejected.`;
        this.users = this.users.filter(u => (u.userId ?? u.id) !== id);
      },
      error: (err) => { this.actioningId = null; this.error = err?.error?.message || 'Failed to reject.'; }
    });
  }
}

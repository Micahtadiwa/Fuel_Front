import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-locked-users',
  templateUrl: './locked-users.component.html',
  styleUrls: ['./locked-users.component.css']
})
export class LockedUsersComponent implements OnInit {
  users:   any[] = [];
  loading = true;
  error   = '';
  unlockingId: number | null = null;
  successMsg = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.api.getLockedUsers().subscribe({
      next:  (users) => { this.loading = false; this.users = users; },
      error: (err)   => { this.loading = false; this.error = err?.error?.message || 'Failed to load locked users.'; }
    });
  }

  unlock(user: any): void {
    const id = user.userId ?? user.id;
    this.unlockingId = id;
    this.successMsg  = '';
    this.error       = '';

    this.api.updateUserActive(id, true).subscribe({
      next: () => {
        this.unlockingId = null;
        this.successMsg  = `${user.username} has been unlocked.`;
        this.users = this.users.filter(u => (u.userId ?? u.id) !== id);
      },
      error: (err) => {
        this.unlockingId = null;
        this.error = err?.error?.message || 'Failed to unlock user.';
      }
    });
  }
}

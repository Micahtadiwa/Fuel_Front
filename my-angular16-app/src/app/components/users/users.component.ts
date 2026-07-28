import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  error   = '';

  quickActions = [
    { title: 'All Users',      desc: 'View and manage system users',  icon: 'fa fa-users',        route: '/userdata',      cls: 'btn-users',    roles: ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER'] },
    { title: 'Create User',    desc: 'Add a new user with a role',    icon: 'fa fa-user-plus',    route: '/create-user',   cls: 'btn-roles',    roles: ['ADMIN_MAKER'] },
    { title: 'Edit User Role', desc: 'Modify user permissions',       icon: 'fa fa-shield',       route: '/editrole',      cls: 'btn-roles',    roles: ['ADMIN_MAKER'] },
    { title: 'View Charts',    desc: 'Analytics and reports',         icon: 'fa fa-bar-chart',    route: '/charts',        cls: 'btn-chart',    roles: ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER', 'FINANCE'] },
    { title: 'Declined Users', desc: 'Users with declined access',    icon: 'fa fa-times-circle', route: '/declinedusers', cls: 'btn-declined', roles: ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER'] },
  ];

  statCards = [
    { label: 'Total Users',      value: 0, key: 'total',    cls: '',         icon: 'fa fa-users'        },
    { label: 'Active Users',     value: 0, key: 'active',   cls: 'active',   icon: 'fa fa-check-circle' },
    { label: 'Inactive Users',   value: 0, key: 'inactive', cls: 'inactive', icon: 'fa fa-ban'          },
    { label: 'Pending Approval', value: 0, key: 'pending',  cls: 'pending',  icon: 'fa fa-clock-o'      },
    { label: 'Declined Access',  value: 0, key: 'declined', cls: 'declined', icon: 'fa fa-times-circle' },
  ];

  constructor(private api: ApiService, private auth: AuthService) {}

  get visibleQuickActions() {
    const role = this.auth.getUserRole();
    return this.quickActions.filter(a => a.roles.includes(role));
  }

  ngOnInit(): void {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (users) => {
        this.loading = false;
        this.users   = users;

        const stats = {
          total:    users.length,
          active:   users.filter(u =>  u.isActive).length,
          inactive: users.filter(u => !u.isActive && String(u.status).toUpperCase() !== 'PENDING' && String(u.status).toUpperCase() !== 'DECLINED').length,
          pending:  users.filter(u => String(u.status).toUpperCase() === 'PENDING').length,
          declined: users.filter(u => String(u.status).toUpperCase() === 'DECLINED').length,
        };

        this.statCards = this.statCards.map(card => ({
          ...card,
          value: stats[card.key as keyof typeof stats],
        }));
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.message || 'Failed to load users. Please try again.';
      }
    });
  }
}

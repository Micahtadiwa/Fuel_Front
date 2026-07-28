import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

interface SidebarItem {
  routeLink: string;
  icon: string;
  label: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed  = false;
  isMobileOpen = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  items: SidebarItem[] = [
    { routeLink: 'dashboard',      icon: 'fa fa-home',             label: 'Dashboard',       roles: ['MANAGER', 'ATTENDANT', 'FINANCE', 'DRIVER', 'USER'] },
    { routeLink: 'users',          icon: 'fa fa-users',            label: 'Users',           roles: ['ADMIN_MAKER', 'ADMIN_CHECKER'] },
    { routeLink: 'create-user',    icon: 'fa fa-user-plus',        label: 'Create User',     roles: ['ADMIN_MAKER'] },
    { routeLink: 'editrole',       icon: 'fa fa-shield',           label: 'Edit Roles',      roles: ['ADMIN_MAKER'] },
    { routeLink: 'vehicles',       icon: 'fa fa-car',              label: 'Vehicles',        roles: ['MANAGER'] },
    { routeLink: 'assign-vehicle', icon: 'fa fa-exchange',         label: 'Assign Vehicle',  roles: ['DRIVER'] },
    { routeLink: 'manager',        icon: 'fa fa-user-tie',         label: 'Approvals',       roles: ['MANAGER'] },
    { routeLink: 'attendant',      icon: 'fa fa-clipboard',        label: 'Dispensing',      roles: ['ATTENDANT'] },
    { routeLink: 'petrol-tank',    icon: 'fa fa-flask',            label: 'Petrol Tank',     roles: ['MANAGER', 'ATTENDANT', 'FINANCE'] },
    { routeLink: 'diesel-tank',    icon: 'fa fa-tint',             label: 'Diesel Tank',     roles: ['MANAGER', 'ATTENDANT', 'FINANCE'] },
    { routeLink: 'refill-tanks',   icon: 'fa fa-refresh',          label: 'Refill Tank',     roles: ['ATTENDANT'] },
    { routeLink: 'tank-refills',   icon: 'fa fa-history',          label: 'Refill History',  roles: ['ATTENDANT', 'MANAGER', 'FINANCE'] },
    { routeLink: 'authorize',      icon: 'fa fa-pencil-square-o',  label: 'Finance Sign',    roles: ['FINANCE'] },
    { routeLink: 'fuel-removals',  icon: 'fa fa-minus-circle',     label: 'Fuel Removals',   roles: ['MANAGER', 'ATTENDANT', 'FINANCE'] },
    { routeLink: 'reports',        icon: 'fa fa-bar-chart',        label: 'Reports',         roles: ['MANAGER', 'ATTENDANT', 'FINANCE'] },
    { routeLink: 'charts',         icon: 'fa fa-pie-chart',        label: 'Analytics',       roles: ['MANAGER', 'FINANCE'] },
    { routeLink: 'pending-users',   icon: 'fa fa-hourglass-half',  label: 'Pending Approvals', roles: ['ADMIN_CHECKER'] },
    { routeLink: 'locked-users',    icon: 'fa fa-ban',             label: 'Locked Users',    roles: ['ADMIN_MAKER', 'ADMIN_CHECKER'] },
    { routeLink: 'change-password', icon: 'fa fa-lock',            label: 'Change Password', roles: ['ADMIN_MAKER'] },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  get visibleItems(): SidebarItem[] {
    const role = this.auth.getUserRole();
    return this.items.filter((item) => item.roles.includes(role));
  }

  get username(): string {
    return this.auth.getUser()?.username || this.auth.getUser()?.name || 'User';
  }

  get userRole(): string {
    const role = this.auth.getUserRole();
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  get userInitials(): string {
    return this.username.charAt(0).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileOpen = false;
  }
}

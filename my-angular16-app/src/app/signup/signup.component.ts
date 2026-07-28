import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  loginObject = { email: '', password: '' };
  loading = false;
  error   = '';
  notice  = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('reason') === 'session-expired') {
      this.notice = 'Your session expired due to inactivity. Please sign in again.';
    }
  }

  private getRedirectRoute(role: string): string {
    switch (role.toUpperCase()) {
      case 'ADMIN_MAKER':   return '/users';
      case 'ADMIN_CHECKER': return '/users';
      case 'MANAGER':   return '/manager';
      case 'FINANCE':   return '/authorize';
      case 'ATTENDANT': return '/attendant';
      case 'DRIVER':    return '/assign-vehicle';
      default:          return '/dashboard';
    }
  }

  private isInactiveLogin(res: any): boolean {
    const user = res?.user ?? res?.data ?? res;
    const rawActive = user?.IsActive ?? user?.isActive ?? user?.is_active ?? user?.active;
    const status = String(user?.status ?? '').trim().toUpperCase();

    if (status === 'INACTIVE') return true;
    if (rawActive === false || rawActive === 0 || rawActive === '0') return true;
    if (typeof rawActive === 'string' && rawActive.toUpperCase() === 'FALSE') return true;

    return false;
  }

  onLogin() {
    const { email, password } = this.loginObject;

    if (!email || !password) {
      this.error = 'Enter your email and password.';
      return;
    }

    this.loading = true;
    this.error   = '';
    this.notice  = '';

    this.api.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        const userData = res?.user ?? res?.data ?? res;
        const token    = res?.token ?? userData?.token;
        const username = userData?.username ?? userData?.name ?? res?.username ?? res?.name ?? '';
        const role     = userData?.role ?? res?.role ?? '';
        this.auth.setUser({ username, role }, token);
        this.router.navigate([this.getRedirectRoute(role)]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Invalid email or password.';
      }
    });
  }

}

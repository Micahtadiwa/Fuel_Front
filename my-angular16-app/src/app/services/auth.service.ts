import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: any = null;
  private token: string | null = null;

  constructor() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = this.normalizeUser(JSON.parse(storedUser));
    }
    this.token = localStorage.getItem('token');
  }

  private normalizeUser(user: any) {
    if (!user) return null;
    return { ...user, role: String(user.role || '').toUpperCase() };
  }

  setUser(user: any, token?: string) {
    this.user = this.normalizeUser(user);
    localStorage.setItem('user', JSON.stringify(this.user));
    if (token) {
      this.token = token;
      localStorage.setItem('token', token);
    }
  }

  getUser() {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  /** Update just the JWT (used by the interceptor for sliding-session refresh). */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getUserRole(): string {
    return this.user?.role || '';
  }

  isLoggedIn(): boolean {
    return !!this.user && !!this.token;
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

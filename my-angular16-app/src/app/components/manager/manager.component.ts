import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {
  records:  any[] = [];
  loading   = true;
  error     = '';

  search       = '';
  fuelFilter   = 'all';
  statusFilter = 'all';
  dateFrom     = '';
  dateTo       = '';

  page             = 1;
  readonly PAGE_SIZE = 20;

  signingId:  number | null = null;
  signedIds:  Set<number>   = new Set();
  confirmId:  number | null = null;
  signError   = '';

  constructor(
    private router: Router,
    private api:    ApiService,
    private auth:   AuthService
  ) {}

  ngOnInit(): void { this.fetchRecords(); }

  fetchRecords(): void {
    this.loading = true;
    this.error   = '';
    this.api.getFuelRecords().subscribe({
      next: (records) => {
        this.records = records;
        this.loading = false;
        records.forEach(r => {
          if (String(r.status ?? '').toUpperCase() === 'MANAGER_APPROVED') this.signedIds.add(r.id);
        });
      },
      error: (err) => { this.error = err?.error?.message || 'Failed to load records.'; this.loading = false; }
    });
  }

  get username(): string {
    const u = this.auth.getUser();
    return u?.username ?? u?.name ?? 'Manager';
  }

  get role(): string { return this.auth.getUserRole(); }

  get signerName(): string { return this.username; }

  private toDateStr(raw: string): string { return raw ? raw.split('T')[0] : ''; }

  get filteredRecords(): any[] {
    const q = this.search.toLowerCase();
    return this.records.filter(r => {
      const fuelMatch   = this.fuelFilter   === 'all' || String(r.fuelType ?? '').toLowerCase() === this.fuelFilter;
      const statusMatch = this.statusFilter === 'all' || String(r.status   ?? '').toUpperCase() === this.statusFilter;
      const d           = this.toDateStr(r.fuelDate);
      const dateMatch   = (!this.dateFrom || d >= this.dateFrom) && (!this.dateTo || d <= this.dateTo);
      const searchMatch = !q || [r.vehicle, r.submittedBy, r.driver, r.department, r.fuelType, r.notes]
        .some(v => String(v ?? '').toLowerCase().includes(q));
      return fuelMatch && statusMatch && dateMatch && searchMatch;
    });
  }

  get stats() {
    const total    = this.records.length;
    const pending  = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'PENDING').length;
    const approved = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'PENDING').length;
    const declined = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'DECLINED').length;
    const signed   = this.signedIds.size;
    const totalL   = this.records.reduce((s, r) => s + (r.liters ?? 0), 0);
    return { total, pending, approved, declined, signed, totalL };
  }

  get hasFilters(): boolean {
    return !!(this.search || this.dateFrom || this.dateTo || this.fuelFilter !== 'all' || this.statusFilter !== 'all');
  }

  clearFilters(): void {
    this.search = ''; this.dateFrom = ''; this.dateTo = '';
    this.fuelFilter = 'all'; this.statusFilter = 'all'; this.page = 1;
  }
  resetPage(): void { this.page = 1; }

  requestSign(id: number): void  { this.confirmId = id; }
  cancelSign():           void  { this.confirmId = null; }

  confirmSign(): void {
    const id = this.confirmId;
    if (id == null) return;
    this.confirmId = null;
    this.signingId = id;
    this.signError = '';

    this.api.updateFuelStatus(id, 'MANAGER_APPROVED').subscribe({
      next: () => {
        this.signingId = null;
        this.signedIds.add(id);
        const idx = this.records.findIndex(r => r.id === id);
        if (idx > -1) this.records[idx] = { ...this.records[idx], status: 'MANAGER_APPROVED' };
      },
      error: (err) => {
        this.signingId = null;
        this.signError = err?.error?.message || 'Failed to sign record.';
      }
    });
  }

  get pagedRecords(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRecords.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRecords.length / this.PAGE_SIZE)); }
  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  isSigned(id: number):  boolean { return this.signedIds.has(id); }
  isSigning(id: number): boolean { return this.signingId === id; }

  statusClass(s: string): string {
    const u = String(s ?? '').toUpperCase();
    if (u === 'MANAGER_APPROVED')   return 'mg-badge--approved';
    if (u === 'ATTENDANT_APPROVED') return 'mg-badge--signed';
    if (u === 'SIGNED')             return 'mg-badge--signed';
    if (u === 'DECLINED')           return 'mg-badge--declined';
    if (u === 'PENDING')            return 'mg-badge--pending';
    return 'mg-badge--other';
  }

  formatNumber(v: any): string {
    return Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  formatDate(v: any): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  goTo(path: string): void { this.router.navigate(['/' + path]); }
}

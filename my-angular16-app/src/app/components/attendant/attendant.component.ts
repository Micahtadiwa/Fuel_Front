import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-attendant',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './attendant.component.html',
  styleUrls: ['./attendant.component.css']
})
export class AttendantComponent implements OnInit {
  records:  any[] = [];
  loading   = true;
  error     = '';

  search       = '';
  fuelFilter   = 'all';
  statusFilter = 'all';

  approvingId:  number | null = null;
  decliningId:  number | null = null;
  actionError   = '';
  actionSuccess = '';

  page             = 1;
  readonly PAGE_SIZE = 20;

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
      next:  (records) => { this.records = records; this.loading = false; },
      error: (err)     => { this.error = err?.error?.message || 'Failed to load records.'; this.loading = false; }
    });
  }

  get username(): string {
    const u = this.auth.getUser();
    return u?.username ?? u?.name ?? 'Attendant';
  }

  get filteredRecords(): any[] {
    const q = this.search.toLowerCase();
    return this.records.filter(r => {
      const fuelMatch   = this.fuelFilter   === 'all' || String(r.fuelType ?? '').toLowerCase() === this.fuelFilter;
      const statusMatch = this.statusFilter === 'all' || String(r.status   ?? '').toUpperCase() === this.statusFilter;
      const searchMatch = !q || [r.vehicle, r.submittedBy, r.driver, r.department, r.fuelType, r.notes]
        .some(v => String(v ?? '').toLowerCase().includes(q));
      return fuelMatch && statusMatch && searchMatch;
    });
  }

  get stats() {
    const total    = this.records.length;
    const pending  = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'PENDING').length;
    const approved = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'MANAGER_APPROVED').length;
    const declined = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'DECLINED').length;
    const signed   = this.records.filter(r => String(r.status ?? '').toUpperCase() === 'SIGNED').length;
    const totalL   = this.records.reduce((s, r) => s + (r.liters ?? 0), 0);
    return { total, pending, approved, declined, signed, totalL };
  }

  get hasFilters(): boolean {
    return !!(this.search || this.fuelFilter !== 'all' || this.statusFilter !== 'all');
  }

  clearFilters(): void { this.search = ''; this.fuelFilter = 'all'; this.statusFilter = 'all'; this.page = 1; }
  resetPage():    void { this.page = 1; }

  approve(r: any): void {
    this.approvingId  = r.id;
    this.actionError  = '';
    this.actionSuccess = '';
    this.api.updateFuelStatus(r.id, 'ATTENDANT_APPROVED').subscribe({
      next: (res) => {
        this.approvingId = null;
        this.updateRecord(r.id, 'ATTENDANT_APPROVED');
        const level   = res?.current_level ?? res?.data?.current_level;
        const pct     = res?.percent_full  ?? res?.data?.percent_full;
        const ft      = String(r.fuelType || '').toLowerCase();
        const tankLbl = ft === 'diesel' ? 'Diesel' : 'Petrol';
        this.actionSuccess = level != null
          ? `Approved — ${r.liters}L ${ft} deducted. ${tankLbl} tank now at ${Number(level).toFixed(1)}L (${pct}%).`
          : `${r.vehicle || 'Record'} approved successfully.`;
        setTimeout(() => { this.actionSuccess = ''; }, 6000);
      },
      error: (err) => {
        this.approvingId = null;
        this.actionError = err?.error?.message || 'Failed to approve record.';
      }
    });
  }

  decline(r: any): void {
    this.decliningId  = r.id;
    this.actionError  = '';
    this.actionSuccess = '';
    this.api.updateFuelStatus(r.id, 'DECLINED').subscribe({
      next: () => {
        this.decliningId = null;
        this.updateRecord(r.id, 'DECLINED');
        this.actionSuccess = `${r.vehicle || 'Record'} declined.`;
        setTimeout(() => { this.actionSuccess = ''; }, 4000);
      },
      error: (err) => {
        this.decliningId = null;
        this.actionError = err?.error?.message || 'Failed to decline record.';
      }
    });
  }

  private updateRecord(id: number, status: string): void {
    const idx = this.records.findIndex(x => x.id === id);
    if (idx > -1) this.records[idx] = { ...this.records[idx], status };
  }

  get pagedRecords(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRecords.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRecords.length / this.PAGE_SIZE)); }
  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  isApproving(id: number): boolean { return this.approvingId === id; }
  isDeclining(id: number): boolean { return this.decliningId === id; }

  statusClass(s: string): string {
    const u = String(s ?? '').toUpperCase();
    if (u === 'ATTENDANT_APPROVED') return 'at-badge--approved';
    if (u === 'MANAGER_APPROVED')   return 'at-badge--pending';
    if (u === 'SIGNED')             return 'at-badge--signed';
    if (u === 'DECLINED')           return 'at-badge--declined';
    if (u === 'PENDING')            return 'at-badge--other';
    return 'at-badge--other';
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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-tank-refill-history',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './tank-refill-history.component.html',
  styleUrls: ['./tank-refill-history.component.css']
})
export class TankRefillHistoryComponent implements OnInit {
  records:    any[]  = [];
  loading     = true;
  error       = '';

  fuelFilter  = 'all';
  dateFrom    = '';
  dateTo      = '';
  search      = '';

  page              = 1;
  readonly PAGE_SIZE = 20;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.fetchRecords(); }

  fetchRecords(): void {
    this.loading = true;
    this.error   = '';
    this.api.getTankRefillHistory().subscribe({
      next:  (data) => { this.records = data; this.loading = false; },
      error: (err)  => { this.error = err?.error?.message || 'Failed to load refill history.'; this.loading = false; }
    });
  }

  get filteredRecords(): any[] {
    const q = this.search.toLowerCase();
    return this.records.filter(r => {
      const fuelMatch = this.fuelFilter === 'all' || r.fuelType === this.fuelFilter;
      const d = this.toDateStr(r.createdAt);
      const dateMatch = (!this.dateFrom || d >= this.dateFrom) && (!this.dateTo || d <= this.dateTo);
      const searchMatch = !q || [r.refilledBy, r.reference, r.fuelType]
        .some(v => String(v ?? '').toLowerCase().includes(q));
      return fuelMatch && dateMatch && searchMatch;
    });
  }

  get stats() {
    const data      = this.filteredRecords;
    const petrolL   = data.filter(r => r.fuelType === 'petrol').reduce((s, r) => s + (r.liters ?? 0), 0);
    const dieselL   = data.filter(r => r.fuelType === 'diesel').reduce((s, r) => s + (r.liters ?? 0), 0);
    const totalL    = petrolL + dieselL;
    return { total: data.length, totalL, petrolL, dieselL };
  }

  get hasFilters(): boolean {
    return !!(this.search || this.dateFrom || this.dateTo || this.fuelFilter !== 'all');
  }

  clearFilters(): void {
    this.search = ''; this.dateFrom = ''; this.dateTo = ''; this.fuelFilter = 'all'; this.page = 1;
  }
  resetPage(): void { this.page = 1; }

  get pagedRecords(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRecords.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRecords.length / this.PAGE_SIZE)); }
  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  tankLabel(tankId: any): string {
    return tankId === 1 || tankId === '1' ? 'Petrol (Tank 1)' : 'Diesel (Tank 2)';
  }

  formatNumber(v: any): string {
    return Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  formatDate(v: any): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v)
      : d.toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' });
  }

  private toDateStr(raw: string): string {
    return raw ? raw.split('T')[0] : '';
  }
}

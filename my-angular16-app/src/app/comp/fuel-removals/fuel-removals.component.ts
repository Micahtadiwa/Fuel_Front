import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-fuel-removals',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './fuel-removals.component.html',
  styleUrls: ['./fuel-removals.component.css']
})
export class FuelRemovalsComponent implements OnInit {
  records: any[] = [];
  loading = true;
  error   = '';

  fuelFilter     = 'all';
  dateFrom       = '';
  dateTo         = '';
  approvedBySearch = '';

  page            = 1;
  readonly PAGE_SIZE = 20;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.fetchRecords(); }

  fetchRecords(): void {
    this.loading = true;
    this.error   = '';
    this.api.getTankRemovals().subscribe({
      next: (records) => {
        this.loading = false;
        this.records = records;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load records.';
      }
    });
  }

  clearFilters(): void {
    this.fuelFilter       = 'all';
    this.dateFrom         = '';
    this.dateTo           = '';
    this.approvedBySearch = '';
    this.page             = 1;
  }
  resetPage(): void { this.page = 1; }

  private toDateStr(raw: string): string { return raw ? raw.split('T')[0] : ''; }

  get filteredRecords(): any[] {
    const q = this.approvedBySearch.toLowerCase().trim();
    return this.records.filter(r => {
      const fuelMatch     = this.fuelFilter === 'all' || String(r.fuelType ?? '').toLowerCase() === this.fuelFilter;
      const d             = this.toDateStr(r.fuelDate);
      const dateMatch     = (!this.dateFrom || d >= this.dateFrom) && (!this.dateTo || d <= this.dateTo);
      const approverMatch = !q || String(r.approvedBy ?? '').toLowerCase().includes(q);
      return fuelMatch && dateMatch && approverMatch;
    });
  }

  get stats() {
    const data      = this.filteredRecords;
    const totalL    = data.reduce((s, r) => s + (r.liters ?? 0), 0);
    const petrolL   = data.filter(r => String(r.fuelType ?? '').toLowerCase() === 'petrol').reduce((s, r) => s + (r.liters ?? 0), 0);
    const dieselL   = data.filter(r => String(r.fuelType ?? '').toLowerCase() === 'diesel').reduce((s, r) => s + (r.liters ?? 0), 0);
    const signedCnt = data.filter(r => String(r.status ?? '').toUpperCase() === 'SIGNED').length;
    return { total: data.length, totalL, petrolL, dieselL, signedCnt };
  }

  get pagedRecords(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRecords.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRecords.length / this.PAGE_SIZE)); }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  get hasActiveFilters(): boolean {
    return !!(this.approvedBySearch || this.dateFrom || this.dateTo || this.fuelFilter !== 'all');
  }

  statusClass(s: string): string {
    const u = String(s ?? '').toUpperCase();
    if (u === 'SIGNED')             return 'fr-badge--signed';
    if (u === 'ATTENDANT_APPROVED') return 'fr-badge--approved';
    if (u === 'MANAGER_APPROVED')   return 'fr-badge--other';
    return 'fr-badge--other';
  }

  exportCsv(): void {
    const data    = this.filteredRecords;
    const headers = ['#', 'Date', 'Vehicle', 'User / Department', 'Manager Approved', 'Attendant Dispensed', 'Finance Signed', 'Fuel Type', 'Litres Removed', 'Mileage', 'Status'];
    const rows    = data.map((r, i) => [
      i + 1,
      this.toDateStr(r.fuelDate),
      r.vehicle ?? '',
      `"${this.userAndDept(r)}"`,
      r.approvedByManager   ?? '',
      r.approvedByAttendant ?? '',
      r.signedByFinance     ?? '',
      r.fuelType ?? '',
      r.liters   ?? 0,
      r.mileage != null ? r.mileage : '',
      r.status   ?? ''
    ]);

    const csv  = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `fuel-removals${this.buildFileSuffix()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const data    = this.filteredRecords;
    const dateStr = new Date().toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
    const totalL  = data.reduce((s, r) => s + (r.liters ?? 0), 0);
    const petrolL = data.filter(r => String(r.fuelType ?? '').toLowerCase() === 'petrol').reduce((s, r) => s + (r.liters ?? 0), 0);
    const dieselL = data.filter(r => String(r.fuelType ?? '').toLowerCase() === 'diesel').reduce((s, r) => s + (r.liters ?? 0), 0);
    const filterLabel = this.buildFilterLabel();

    const rows = data.map((r, i) => `
      <tr>
        <td class="idx">${i + 1}</td>
        <td>${this.formatDate(r.fuelDate)}</td>
        <td class="plate">${r.vehicle || '—'}</td>
        <td>${this.userAndDept(r)}</td>
        <td class="approver">${r.approvedByManager   || '—'}</td>
        <td class="approver">${r.approvedByAttendant || '—'}</td>
        <td class="approver">${r.signedByFinance     || '—'}</td>
        <td class="fuel-${String(r.fuelType || '').toLowerCase()}">${r.fuelType || '—'}</td>
        <td class="num liters">${this.formatNumber(r.liters)}L</td>
        <td class="num">${r.mileage != null ? this.formatNumber(r.mileage) : '—'}</td>
        <td><span class="badge badge-${String(r.status || '').toLowerCase()}">${r.status || '—'}</span></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Fuel Removals Report — ${dateStr}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:28px 32px}
        h1{font-size:20px;font-weight:700;color:#111827;margin-bottom:2px}
        .sub{font-size:11px;color:#6b7280;margin-bottom:10px}
        .filter-info{font-size:10px;color:#6b7280;margin-bottom:16px;padding:6px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;display:inline-block}
        .kpi{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
        .kpi-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 16px;flex:1;min-width:100px}
        .kpi-card.red{border-top:3px solid #dc2626}.kpi-card.blue{border-top:3px solid #2563eb}
        .kpi-card.amber{border-top:3px solid #d97706}.kpi-card.green{border-top:3px solid #16a34a}
        .kpi-label{font-size:9px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
        .kpi-val{font-size:18px;font-weight:700;color:#111827}
        table{width:100%;border-collapse:collapse}
        thead{background:#f3f4f6}
        th{font-size:9px;text-transform:uppercase;color:#6b7280;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb;letter-spacing:.04em}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
        tr:last-child td{border-bottom:none}tr:nth-child(even){background:#fafafa}
        .idx{color:#9ca3af;font-size:10px;width:28px}.plate{font-weight:600}
        .approver{font-weight:600;color:#1d4ed8}
        .num{text-align:right;font-variant-numeric:tabular-nums}.liters{font-weight:700;color:#dc2626}
        .fuel-petrol{color:#1d4ed8;font-weight:600}.fuel-diesel{color:#92400e;font-weight:600}
        .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:600}
        .badge-approved{background:#dcfce7;color:#15803d}.badge-signed{background:#dbeafe;color:#1d4ed8}
        .tfoot td{background:#f9fafb;border-top:2px solid #e5e7eb;font-size:11px;padding:8px 10px}
        .tfoot-total{font-weight:700;color:#dc2626;text-align:right}
        .footer{margin-top:20px;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:10px}
        @media print{body{padding:16px}@page{margin:1.5cm}}
      </style>
    </head><body>
      <h1>Fuel Removed from Tanks</h1>
      <p class="sub">Generated ${dateStr} &nbsp;·&nbsp; ${data.length} record${data.length !== 1 ? 's' : ''}</p>
      ${filterLabel ? `<div class="filter-info">Filters: ${filterLabel}</div>` : ''}
      <div class="kpi">
        <div class="kpi-card red"><div class="kpi-label">Total Removed</div><div class="kpi-val">${this.formatNumber(totalL)}L</div></div>
        <div class="kpi-card blue"><div class="kpi-label">Petrol</div><div class="kpi-val">${this.formatNumber(petrolL)}L</div></div>
        <div class="kpi-card amber"><div class="kpi-label">Diesel</div><div class="kpi-val">${this.formatNumber(dieselL)}L</div></div>
        <div class="kpi-card green"><div class="kpi-label">Records</div><div class="kpi-val">${data.length}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Date</th><th>Vehicle</th><th>User / Department</th>
          <th>Manager Approved</th><th>Attendant Dispensed</th><th>Finance Signed</th>
          <th>Fuel Type</th><th class="num">Litres</th><th class="num">Mileage</th><th>Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot class="tfoot"><tr>
          <td colspan="8">Total — ${data.length} record${data.length !== 1 ? 's' : ''}</td>
          <td class="tfoot-total">${this.formatNumber(totalL)}L</td>
          <td colspan="2" style="color:#6b7280">Petrol ${this.formatNumber(petrolL)}L · Diesel ${this.formatNumber(dieselL)}L</td>
        </tr></tfoot>
      </table>
      <div class="footer"><span>Fuel Management System</span><span>${dateStr}</span></div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=960,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 600);
    }
  }

  private buildFileSuffix(): string {
    const parts: string[] = [];
    if (this.fuelFilter       !== 'all') parts.push(`-${this.fuelFilter}`);
    if (this.dateFrom)                   parts.push(`-from-${this.dateFrom}`);
    if (this.dateTo)                     parts.push(`-to-${this.dateTo}`);
    if (this.approvedBySearch)           parts.push(`-${this.approvedBySearch.replace(/\s+/g, '_')}`);
    return parts.join('');
  }

  private buildFilterLabel(): string {
    const parts: string[] = [];
    if (this.fuelFilter !== 'all') parts.push(this.fuelFilter.charAt(0).toUpperCase() + this.fuelFilter.slice(1));
    if (this.dateFrom)             parts.push(`From ${this.dateFrom}`);
    if (this.dateTo)               parts.push(`To ${this.dateTo}`);
    if (this.approvedBySearch)     parts.push(`Approved By "${this.approvedBySearch}"`);
    return parts.join(' · ');
  }

  userAndDept(r: any): string {
    const user = (r.submittedBy ?? '').trim();
    const dept = (r.department  ?? '').trim();
    if (user && dept) return `${user} / ${dept}`;
    return user || dept || '—';
  }

  formatNumber(v: any): string { return Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }

  formatDate(v: any): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

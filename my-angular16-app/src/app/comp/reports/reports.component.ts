import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  records:      any[]   = [];
  loading       = true;
  error         = '';

  search        = '';
  fuelFilter    = 'all';
  statusFilter  = 'all';
  dateFrom      = '';
  dateTo        = '';

  page            = 1;
  readonly PAGE_SIZE = 20;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.fetchRecords(); }

  fetchRecords(): void {
    this.loading = true;
    this.error   = '';
    this.api.getFuelRecords().subscribe({
      next:  (records) => { this.loading = false; this.records = records; },
      error: (err)     => { this.loading = false; this.error = err?.error?.message || 'Failed to load records.'; }
    });
  }

  setFuelFilter(type: string):   void { this.fuelFilter   = type; this.page = 1; }
  setStatusFilter(s: string):    void { this.statusFilter  = s;   this.page = 1; }
  clearFilters():                void { this.search = ''; this.dateFrom = ''; this.dateTo = ''; this.statusFilter = 'all'; this.fuelFilter = 'all'; this.page = 1; }
  resetPage():                   void { this.page = 1; }

  private toDateStr(raw: string): string {
    if (!raw) return '';
    // handle both "2024-01-15" and "2024-01-15T10:00:00Z"
    return raw.split('T')[0];
  }

  private inDateRange(recordDate: string): boolean {
    const d = this.toDateStr(recordDate);
    if (this.dateFrom && d < this.dateFrom) return false;
    if (this.dateTo   && d > this.dateTo)   return false;
    return true;
  }

  get filteredRecords(): any[] {
    const q = this.search.toLowerCase();
    return this.records.filter(r => {
      const fuelMatch   = this.fuelFilter   === 'all' || String(r.fuelType  ?? '').toLowerCase() === this.fuelFilter;
      const statusMatch = this.statusFilter === 'all' || String(r.status    ?? '').toUpperCase() === this.statusFilter;
      const dateMatch   = this.inDateRange(r.fuelDate);
      const searchMatch = !q || [r.vehicle, r.submittedBy, r.driver, r.department, r.notes, r.fuelDate, r.status, r.fuelType]
        .some(v => String(v ?? '').toLowerCase().includes(q));
      return fuelMatch && statusMatch && dateMatch && searchMatch;
    });
  }

  get stats() {
    const data       = this.filteredRecords;
    const totalL     = data.reduce((s, r) => s + (r.liters ?? 0), 0);
    const approved   = data.filter(r => ['MANAGER_APPROVED', 'ATTENDANT_APPROVED', 'SIGNED'].includes(String(r.status ?? '').toUpperCase()));
    const pending    = data.filter(r => String(r.status ?? '').toUpperCase() === 'PENDING');
    const declined   = data.filter(r => String(r.status ?? '').toUpperCase() === 'DECLINED');
    const sorted     = [...data].sort((a, b) => this.toDateStr(b.fuelDate).localeCompare(this.toDateStr(a.fuelDate)));
    return {
      totalRecords:  data.length,
      totalLiters:   totalL,
      avgLiters:     data.length ? Math.round(totalL / data.length) : 0,
      approvedCount: approved.length,
      pendingCount:  pending.length,
      declinedCount: declined.length,
      latestDate:    sorted[0]?.fuelDate || '-',
    };
  }

  get pagedRecords(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRecords.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRecords.length / this.PAGE_SIZE)); }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  get hasActiveFilters(): boolean {
    return !!(this.search || this.dateFrom || this.dateTo || this.fuelFilter !== 'all' || this.statusFilter !== 'all');
  }

  exportCsv(): void {
    const data    = this.filteredRecords;
    const label   = this.buildFilterLabel();
    const headers = ['#', 'Vehicle', 'Submitted By', 'User / Department', 'Manager Approved', 'Attendant Dispensed', 'Finance Signed', 'Fuel Type', 'Litres', 'Mileage', 'Date', 'Status', 'Notes'];
    const rows    = data.map((r, i) => [
      i + 1,
      r.vehicle ?? '', r.submittedBy ?? '', `"${this.userAndDept(r)}"`,
      r.approvedByManager ?? '', r.approvedByAttendant ?? '', r.signedByFinance ?? '',
      r.fuelType ?? '', r.liters ?? 0, r.mileage ?? '',
      this.toDateStr(r.fuelDate),
      r.status ?? '', `"${(r.notes ?? '').replace(/"/g, '""')}"`
    ]);

    const csv  = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `fuel-report${label}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const data    = this.filteredRecords;
    const dateStr = new Date().toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
    const label   = this.buildFilterLabel(true);
    const totalL  = data.reduce((s, r) => s + (r.liters ?? 0), 0);
    const approvedCount = data.filter(r => ['MANAGER_APPROVED', 'ATTENDANT_APPROVED', 'SIGNED'].includes(String(r.status ?? '').toUpperCase())).length;
    const pendingCount  = data.filter(r => String(r.status ?? '').toUpperCase() === 'PENDING').length;
    const declinedCount = data.filter(r => String(r.status ?? '').toUpperCase() === 'DECLINED').length;

    const badgeCls = (s: string) => {
      const u = String(s ?? '').toUpperCase();
      if (u === 'MANAGER_APPROVED')   return 'badge-approved';
      if (u === 'ATTENDANT_APPROVED') return 'badge-approved';
      if (u === 'SIGNED')             return 'badge-signed';
      if (u === 'DECLINED')           return 'badge-declined';
      if (u === 'PENDING')            return 'badge-pending';
      return 'badge-other';
    };

    const rows = data.map(r => `
      <tr>
        <td>${r.vehicle    || '—'}</td>
        <td>${r.submittedBy || '—'}</td>
        <td>${this.userAndDept(r)}</td>
        <td>${r.approvedByManager   || '—'}</td>
        <td>${r.approvedByAttendant || '—'}</td>
        <td>${r.signedByFinance     || '—'}</td>
        <td class="fuel-${String(r.fuelType||'').toLowerCase()}">${r.fuelType || '—'}</td>
        <td class="num">${this.formatNumber(r.liters)}</td>
        <td class="num">${r.mileage != null ? this.formatNumber(r.mileage) : '—'}</td>
        <td>${this.formatDate(r.fuelDate)}</td>
        <td><span class="badge ${badgeCls(r.status)}">${r.status || '—'}</span></td>
        <td class="notes">${r.notes || '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Fuel Report — ${dateStr}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:28px 32px}
        h1{font-size:20px;font-weight:700;color:#111827;margin-bottom:2px}
        .sub{font-size:11px;color:#6b7280;margin-bottom:12px}
        .filter-info{font-size:10px;color:#6b7280;margin-bottom:16px;padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;display:inline-block}
        .kpi{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
        .kpi-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 16px;min-width:100px;flex:1}
        .kpi-card.blue{border-top:3px solid #2563eb}
        .kpi-card.green{border-top:3px solid #16a34a}
        .kpi-card.amber{border-top:3px solid #d97706}
        .kpi-card.red{border-top:3px solid #dc2626}
        .kpi-card.purple{border-top:3px solid #7c3aed}
        .kpi-label{font-size:9px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
        .kpi-val{font-size:18px;font-weight:700;color:#111827}
        table{width:100%;border-collapse:collapse}
        thead{background:#f3f4f6}
        th{font-size:9px;text-transform:uppercase;color:#6b7280;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb;letter-spacing:.04em}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
        tr:last-child td{border-bottom:none}
        tr:nth-child(even){background:#fafafa}
        .num{text-align:right;font-variant-numeric:tabular-nums}
        .notes{color:#6b7280;font-size:10px;max-width:140px}
        .fuel-diesel{color:#92400e;font-weight:600}
        .fuel-petrol{color:#1d4ed8;font-weight:600}
        .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:600}
        .badge-approved{background:#dcfce7;color:#15803d}
        .badge-signed{background:#dbeafe;color:#1d4ed8}
        .badge-declined{background:#fff1f2;color:#be123c}
        .badge-pending{background:#fef9c3;color:#854d0e}
        .badge-other{background:#f3f4f6;color:#6b7280}
        .footer{margin-top:20px;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:10px}
        @media print{body{padding:16px}@page{margin:1.5cm}}
      </style>
    </head><body>
      <h1>Fuel Report</h1>
      <p class="sub">Generated ${dateStr} &nbsp;·&nbsp; ${data.length} record${data.length !== 1 ? 's' : ''}</p>
      ${label ? `<div class="filter-info">Filters applied: ${label}</div>` : ''}
      <div class="kpi">
        <div class="kpi-card blue"><div class="kpi-label">Total Records</div><div class="kpi-val">${data.length}</div></div>
        <div class="kpi-card green"><div class="kpi-label">Approved / Signed</div><div class="kpi-val">${approvedCount}</div></div>
        <div class="kpi-card amber"><div class="kpi-label">Pending</div><div class="kpi-val">${pendingCount}</div></div>
        <div class="kpi-card red"><div class="kpi-label">Declined</div><div class="kpi-val">${declinedCount}</div></div>
        <div class="kpi-card purple"><div class="kpi-label">Total Litres</div><div class="kpi-val">${this.formatNumber(totalL)}L</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Vehicle</th><th>Submitted By</th><th>User / Department</th>
          <th>Manager Approved</th><th>Attendant Dispensed</th><th>Finance Signed</th>
          <th>Fuel Type</th><th class="num">Litres</th><th class="num">Mileage</th>
          <th>Date</th><th>Status</th><th>Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <span>Fuel Management System</span>
        <span>${dateStr}</span>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=960,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 600);
    }
  }

  private buildFilterLabel(readable = false): string {
    const parts: string[] = [];
    if (this.fuelFilter   !== 'all') parts.push(readable ? this.fuelFilter.charAt(0).toUpperCase() + this.fuelFilter.slice(1) : `-${this.fuelFilter}`);
    if (this.statusFilter !== 'all') parts.push(readable ? this.statusFilter : `-${this.statusFilter.toLowerCase()}`);
    if (this.dateFrom)               parts.push(readable ? `From ${this.dateFrom}` : `-from-${this.dateFrom}`);
    if (this.dateTo)                 parts.push(readable ? `To ${this.dateTo}`     : `-to-${this.dateTo}`);
    if (this.search)                 parts.push(readable ? `Search "${this.search}"` : '');
    return readable ? parts.filter(Boolean).join(' · ') : parts.filter(Boolean).join('');
  }

  userAndDept(r: any): string {
    const user = (r.driver ?? '').trim();
    const dept = (r.department ?? '').trim();
    if (user && dept) return `${user} / ${dept}`;
    return user || dept || '—';
  }

  formatNumber(v: any): string { return Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  formatDate(v: any):   string { if (!v) return '-'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' }); }
  statusClass(s: string): string {
    const u = String(s ?? '').toUpperCase();
    if (u === 'APPROVED') return 'badge--approved';
    if (u === 'SIGNED')   return 'badge--signed';
    if (u === 'DECLINED') return 'badge--declined';
    if (u === 'PENDING')  return 'badge--pending';
    return 'badge--other';
  }
}

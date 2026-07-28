import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-authorize-fuel',
  templateUrl: './authorize-fuel.component.html',
  styleUrls: ['./authorize-fuel.component.css']
})
export class AuthorizeFuelComponent implements OnInit {
  records:  any[] = [];
  loading   = true;
  error     = '';

  fuelFilter   = 'all';   // 'all' | 'petrol' | 'diesel'
  statusFilter = 'all';   // 'all' | 'approved' | 'signed'
  dateFrom     = '';
  dateTo       = '';

  page            = 1;
  readonly PAGE_SIZE = 20;

  signingId:  number | null = null;
  signedIds:  Set<number>   = new Set();
  errorIds:   Map<number, string> = new Map();
  confirmId:  number | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void { this.fetchRecords(); }

  fetchRecords(): void {
    this.loading = true;
    this.error   = '';
    this.api.getFuelRecords().subscribe({
      next: (records) => {
        this.loading = false;
        this.records = records.filter(r =>
          ['ATTENDANT_APPROVED', 'SIGNED'].includes(String(r.status ?? '').toUpperCase())
        );
        this.records.forEach(r => {
          if (String(r.status).toUpperCase() === 'SIGNED') this.signedIds.add(r.id);
        });
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.message || 'Failed to load records.';
      }
    });
  }

  get filteredRecords(): any[] {
    return this.records.filter(r => {
      const ft     = String(r.fuelType ?? '').toLowerCase();
      const signed = this.signedIds.has(r.id);
      const st     = signed ? 'signed' : 'approved';

      if (this.fuelFilter !== 'all' && ft !== this.fuelFilter) return false;
      if (this.statusFilter !== 'all' && st !== this.statusFilter) return false;

      if (this.dateFrom || this.dateTo) {
        const raw  = r.fuelDate ?? r.fuel_date ?? '';
        const date = raw ? new Date(raw) : null;
        if (!date || isNaN(date.getTime())) return true;
        if (this.dateFrom && date < new Date(this.dateFrom)) return false;
        if (this.dateTo   && date > new Date(this.dateTo + 'T23:59:59')) return false;
      }

      return true;
    });
  }

  get stats() {
    const total   = this.records.length;
    const signed  = this.signedIds.size;
    const waiting = total - signed;
    return { total, signed, waiting };
  }

  get pagedRecords(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRecords.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRecords.length / this.PAGE_SIZE)); }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  get hasFilters(): boolean {
    return this.fuelFilter !== 'all' || this.statusFilter !== 'all' || !!this.dateFrom || !!this.dateTo;
  }

  clearFilters(): void {
    this.fuelFilter   = 'all';
    this.statusFilter = 'all';
    this.dateFrom     = '';
    this.dateTo       = '';
    this.page         = 1;
  }
  resetPage(): void { this.page = 1; }

  get signerName(): string {
    const u = this.auth.getUser();
    return u?.username ?? u?.name ?? 'Finance Officer';
  }

  requestSign(id: number): void  { this.confirmId = id; }
  cancelSign():           void  { this.confirmId = null; }

  confirmSign(): void {
    const id = this.confirmId;
    if (id == null) return;
    this.confirmId = null;
    this.errorIds.delete(id);
    this.signingId = id;

    this.api.updateFuelStatus(id, 'SIGNED').subscribe({
      next: () => {
        this.signingId = null;
        this.signedIds.add(id);
        const idx = this.records.findIndex(r => r.id === id);
        if (idx > -1) this.records[idx] = { ...this.records[idx], status: 'SIGNED' };
      },
      error: (err) => {
        this.signingId = null;
        this.errorIds.set(id, err?.error?.message || 'Failed to sign record.');
      }
    });
  }

  isSigned(id: number):  boolean { return this.signedIds.has(id); }
  isSigning(id: number): boolean { return this.signingId === id; }
  rowError(id: number):  string  { return this.errorIds.get(id) ?? ''; }

  // ── Exports (all use the current filtered view) ───────────────────────────────

  exportCsv(): void {
    const data    = this.filteredRecords;
    const label   = this.buildFilterLabel();
    const headers = ['#', 'Vehicle', 'Submitted By', 'User and Department', 'Fuel Type', 'Litres', 'Mileage', 'Date', 'Status', 'Notes'];
    const rows    = data.map((r, i) => [
      i + 1,
      r.vehicle    ?? '', r.submittedBy ?? '', r.driver ?? '',
      r.fuelType   ?? '', r.liters     ?? 0,  r.mileage    ?? '',
      this.toDateStr(r.fuelDate),
      this.signedIds.has(r.id) ? 'SIGNED' : (r.status ?? ''),
      `"${(r.notes ?? '').replace(/"/g, '""')}"`
    ]);
    this.downloadCsv([headers, ...rows], `finance-authorization${label}-${this.today()}.csv`);
  }

  exportPdf(): void {
    const data    = this.filteredRecords;
    const dateStr = new Date().toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
    const label   = this.buildFilterLabel(true);
    const signed  = data.filter(r => this.signedIds.has(r.id)).length;
    const waiting = data.length - signed;

    const rows = data.map(r => {
      const isSigned = this.signedIds.has(r.id);
      const status   = isSigned ? 'SIGNED' : (r.status ?? '');
      const badgeCls = isSigned ? 'badge-signed' : 'badge-approved';
      return `
        <tr class="${isSigned ? 'row-signed' : ''}">
          <td>${r.vehicle  || '—'}</td>
          <td>${r.submittedBy || '—'}</td>
          <td>${r.driver || '—'}</td>
          <td class="fuel-${String(r.fuelType || '').toLowerCase()}">${r.fuelType || '—'}</td>
          <td class="num">${this.formatNumber(r.liters)}</td>
          <td class="num">${r.mileage != null ? this.formatNumber(r.mileage) : '—'}</td>
          <td>${this.formatDate(r.fuelDate)}</td>
          <td><span class="badge ${badgeCls}">${status}</span></td>
          <td class="notes">${r.notes || '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Finance Authorization${label} — ${dateStr}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:28px 32px}
        .page-header{display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #e5e7eb}
        .page-icon{width:44px;height:44px;border-radius:12px;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        h1{font-size:20px;font-weight:700;color:#111827;margin-bottom:2px}
        .sub{font-size:11px;color:#6b7280}
        .filter-info{font-size:10px;color:#6b7280;margin-bottom:18px;padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;display:inline-block}
        .kpi{display:flex;gap:12px;margin-bottom:20px}
        .kpi-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 16px;flex:1}
        .kpi-label{font-size:9px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
        .kpi-val{font-size:18px;font-weight:700;color:#111827}
        .kpi-card.blue{border-top:3px solid #2563eb}
        .kpi-card.amber{border-top:3px solid #d97706}
        .kpi-card.green{border-top:3px solid #16a34a}
        table{width:100%;border-collapse:collapse}
        thead{background:#f3f4f6}
        th{font-size:9px;text-transform:uppercase;color:#6b7280;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb;letter-spacing:.04em}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
        tr:last-child td{border-bottom:none}
        tr:nth-child(even){background:#fafafa}
        .row-signed{opacity:.75}
        .num{text-align:right;font-variant-numeric:tabular-nums}
        .notes{color:#6b7280;font-size:10px;max-width:130px}
        .fuel-diesel{color:#92400e;font-weight:600}
        .fuel-petrol{color:#1d4ed8;font-weight:600}
        .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:600}
        .badge-approved{background:#dbeafe;color:#1d4ed8}
        .badge-signed{background:#dcfce7;color:#15803d}
        .footer{margin-top:20px;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:10px}
        @media print{body{padding:16px}@page{margin:1.5cm}}
      </style>
    </head><body>
      <div class="page-header">
        <div class="page-icon">&#9998;</div>
        <div>
          <h1>Finance Authorization Report</h1>
          <div class="sub">Approved fuel dispensing records — ${dateStr}</div>
        </div>
      </div>
      ${label ? `<div class="filter-info">Filters applied: ${label.replace(/^[-\s]+/, '')}</div>` : ''}
      <div class="kpi">
        <div class="kpi-card blue"><div class="kpi-label">Records Shown</div><div class="kpi-val">${data.length}</div></div>
        <div class="kpi-card amber"><div class="kpi-label">Awaiting Signature</div><div class="kpi-val">${waiting}</div></div>
        <div class="kpi-card green"><div class="kpi-label">Signed</div><div class="kpi-val">${signed}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Vehicle</th><th>Submitted By</th><th>User and Department</th><th>Fuel Type</th>
          <th class="num">Litres</th><th class="num">Mileage</th>
          <th>Date</th><th>Status</th><th>Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <span>Finance Authorization — Generated by ${this.signerName}</span>
        <span>${dateStr}</span>
      </div>
    </body></html>`;

    this.openPrintWindow(html);
  }

  exportSignedCsv(): void {
    const signed  = this.filteredRecords.filter(r => this.signedIds.has(r.id));
    const label   = this.buildFilterLabel();
    const headers = ['#', 'Vehicle', 'Submitted By', 'User and Department', 'Fuel Type', 'Litres', 'Mileage', 'Fuel Date', 'Signed By', 'Status', 'Notes'];
    const rows    = signed.map((r, i) => [
      i + 1,
      r.vehicle    ?? '', r.submittedBy ?? '', r.driver ?? '',
      r.fuelType   ?? '', r.liters     ?? 0,  r.mileage    ?? '',
      this.toDateStr(r.fuelDate),
      this.signerName,
      'SIGNED',
      `"${(r.notes ?? '').replace(/"/g, '""')}"`
    ]);
    this.downloadCsv([headers, ...rows], `signed-records${label}-${this.today()}.csv`);
  }

  exportSignedPdf(): void {
    const signed  = this.filteredRecords.filter(r => this.signedIds.has(r.id));
    const dateStr = new Date().toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
    const label   = this.buildFilterLabel(true);
    const totalL  = signed.reduce((s, r) => s + (r.liters ?? 0), 0);
    const uniqueVehicles = [...new Set(signed.map(r => r.vehicle).filter(Boolean))];
    const uniqueDrivers  = [...new Set(signed.map(r => r.driver).filter(Boolean))];
    const uniqueSubmitters = [...new Set(signed.map(r => r.submittedBy).filter(Boolean))];

    const rows = signed.map((r, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="plate">${r.vehicle || '—'}</td>
        <td>${r.submittedBy || '—'}</td>
        <td>${r.driver || '—'}</td>
        <td class="fuel-${String(r.fuelType || '').toLowerCase()}">${r.fuelType || '—'}</td>
        <td class="num">${this.formatNumber(r.liters)}</td>
        <td class="num">${r.mileage != null ? this.formatNumber(r.mileage) : '—'}</td>
        <td>${this.formatDate(r.fuelDate)}</td>
        <td class="signer-col">${this.signerName}</td>
        <td class="notes">${r.notes || '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Signed Fuel Records${label} — ${dateStr}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:28px 32px}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #2563eb}
        .page-header-left h1{font-size:20px;font-weight:700;color:#111827;margin-bottom:4px}
        .page-header-left .sub{font-size:11px;color:#6b7280}
        .page-header-right{text-align:right;font-size:10px;color:#6b7280;line-height:1.7}
        .page-header-right strong{color:#111827;font-size:12px}
        .filter-info{font-size:10px;color:#6b7280;margin-bottom:16px;padding:6px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;display:inline-block}
        .meta-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:20px}
        .meta-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px}
        .meta-card.blue{border-top:3px solid #2563eb}
        .meta-card.green{border-top:3px solid #16a34a}
        .meta-card.amber{border-top:3px solid #d97706}
        .meta-card.purple{border-top:3px solid #7c3aed}
        .meta-label{font-size:9px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;margin-bottom:3px}
        .meta-val{font-size:17px;font-weight:700;color:#111827}
        .meta-sub{font-size:9px;color:#9ca3af;margin-top:2px}
        .section-title{font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.06em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb}
        .users-section{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
        .users-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px}
        .user-pill{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:3px 10px 3px 6px;margin:3px 3px 3px 0;font-size:10px;color:#374151}
        .user-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .dot-driver{background:#2563eb}
        .dot-signer{background:#16a34a}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        thead{background:#1e3a8a;color:#fff}
        th{font-size:9px;text-transform:uppercase;padding:9px 10px;text-align:left;letter-spacing:.04em;font-weight:600;color:#fff}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:nth-child(even){background:#fafafa}
        .num{text-align:right;font-variant-numeric:tabular-nums}
        .plate{font-weight:700;font-family:monospace;font-size:12px;color:#111827}
        .notes{color:#6b7280;font-size:10px;max-width:100px}
        .signer-col{color:#15803d;font-weight:600;font-size:10px}
        .fuel-diesel{color:#92400e;font-weight:600}
        .fuel-petrol{color:#1d4ed8;font-weight:600}
        .signature-section{margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px}
        .sig-box{text-align:center}
        .sig-line{border-bottom:1.5px solid #374151;margin-bottom:4px;height:36px}
        .sig-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}
        .sig-name{font-size:10px;font-weight:700;color:#111827;margin-top:2px}
        .footer{margin-top:20px;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb}
        @media print{body{padding:16px}@page{margin:1.2cm}thead{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style>
    </head><body>
      <div class="page-header">
        <div class="page-header-left">
          <h1>Signed Fuel Records Report</h1>
          <div class="sub">Finance Authorization — Signed dispensing records</div>
        </div>
        <div class="page-header-right">
          <div>Generated: <strong>${dateStr}</strong></div>
          <div>Finance Officer: <strong>${this.signerName}</strong></div>
          <div>Total Signed: <strong>${signed.length} record${signed.length !== 1 ? 's' : ''}</strong></div>
        </div>
      </div>
      ${label ? `<div class="filter-info">Filters applied: ${label.replace(/^[-\s]+/, '')}</div>` : ''}
      <div class="meta-grid">
        <div class="meta-card blue"><div class="meta-label">Signed Records</div><div class="meta-val">${signed.length}</div></div>
        <div class="meta-card green"><div class="meta-label">Total Litres</div><div class="meta-val">${this.formatNumber(totalL)}L</div></div>
        <div class="meta-card amber"><div class="meta-label">Vehicles</div><div class="meta-val">${uniqueVehicles.length}</div><div class="meta-sub">${uniqueVehicles.join(', ') || '—'}</div></div>
        <div class="meta-card purple"><div class="meta-label">Submitters</div><div class="meta-val">${uniqueSubmitters.length}</div></div>
      </div>
      <div class="users-section">
        <div class="users-card">
          <div class="section-title">Fuel Submitters</div>
          ${uniqueSubmitters.map(d => `<span class="user-pill"><span class="user-dot dot-driver"></span>${d}</span>`).join('') || '—'}
        </div>
        <div class="users-card">
          <div class="section-title">Finance Signatory</div>
          <span class="user-pill"><span class="user-dot dot-signer"></span>${this.signerName}</span>
        </div>
      </div>
      <div class="section-title">Signed Records Detail</div>
      <table>
        <thead><tr>
          <th class="num">#</th><th>Vehicle</th><th>Submitted By</th><th>User and Department</th>
          <th>Fuel Type</th><th class="num">Litres</th><th class="num">Mileage</th>
          <th>Fuel Date</th><th>Signed By</th><th>Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="signature-section">
        <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Finance Officer Signature</div><div class="sig-name">${this.signerName}</div></div>
        <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Manager Approval</div></div>
        <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Date</div><div class="sig-name">${dateStr}</div></div>
      </div>
      <div class="footer">
        <span>Fuel Management System — Confidential</span>
        <span>Page 1 &nbsp;·&nbsp; ${dateStr}</span>
      </div>
    </body></html>`;

    this.openPrintWindow(html, 1050);
  }

  // ── Private helpers ────────────────────────────────────────────────────────────

  private buildFilterLabel(readable = false): string {
    const parts: string[] = [];
    if (this.fuelFilter !== 'all')   parts.push(readable ? this.fuelFilter.charAt(0).toUpperCase() + this.fuelFilter.slice(1) : `-${this.fuelFilter}`);
    if (this.statusFilter !== 'all') parts.push(readable ? this.statusFilter.charAt(0).toUpperCase() + this.statusFilter.slice(1) : `-${this.statusFilter}`);
    if (this.dateFrom)               parts.push(readable ? `From ${this.dateFrom}` : `-from-${this.dateFrom}`);
    if (this.dateTo)                 parts.push(readable ? `To ${this.dateTo}` : `-to-${this.dateTo}`);
    return readable ? parts.join(' · ') : parts.join('');
  }

  private downloadCsv(rows: any[][], filename: string): void {
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private openPrintWindow(html: string, width = 960): void {
    const win = window.open('', '_blank', `width=${width},height=700`);
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    }
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private toDateStr(raw: string): string { return raw ? raw.split('T')[0] : ''; }

  formatNumber(v: any): string {
    return Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  formatDate(v: any): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

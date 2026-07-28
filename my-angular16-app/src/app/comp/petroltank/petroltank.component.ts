import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

interface BarData  { key: string; month: string; liters: number; }
interface KpiCard  { label: string; value: string | number; sub: string; icon: string; color: string; }

@Component({
  selector: 'app-petroltank',
  templateUrl: './petroltank.component.html',
  styleUrls: ['./petroltank.component.css']
})
export class PetroltankComponent implements OnInit, OnDestroy {

  readonly FUEL_TYPE = 'petrol';
  readonly TANK_ID   = 1;
  readonly MONTHS    = 12;

  records:  any[] = [];
  loading   = true;
  error     = '';
  search    = '';

  page            = 1;
  readonly PAGE_SIZE = 20;

  tank = { capacity: 10000, current_level: 0, percent_full: 0 };
  tankFillPercent = 0;
  tankError       = '';
  private fillTimer: any;

  today = new Date();

  // ── lifecycle ──────────────────────────────────────────────────────────────

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchRecords();
    this.fetchTank();
  }

  ngOnDestroy() {
    clearTimeout(this.fillTimer);
  }

  // ── data fetching ──────────────────────────────────────────────────────────

  fetchRecords() {
    this.loading = true;
    this.api.getFuelRecords().subscribe({
      next: (data) => { this.loading = false; this.records = data; },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'Failed to load records.'; }
    });
  }

  fetchTank() {
    this.tankError = '';
    this.api.getTankById(this.TANK_ID).subscribe({
      next: (data) => {
        this.tank = data;
        this.fillTimer = setTimeout(() => { this.tankFillPercent = this.tankPercent; }, 400);
      },
      error: (err) => {
        this.tankError = err?.error?.message || 'Tank data unavailable.';
      }
    });
  }

  // ── derived values ─────────────────────────────────────────────────────────

  get fuelRecords(): any[] {
    return this.records.filter(r =>
      String(r.fuelType || '').toLowerCase() === this.FUEL_TYPE &&
      ['ATTENDANT_APPROVED', 'SIGNED'].includes(String(r.status || '').toUpperCase())
    );
  }

  get filtered(): any[] {
    const s = this.search.toLowerCase();
    if (!s) return this.fuelRecords;
    return this.fuelRecords.filter(r =>
      [r.driver, r.vehicle, r.notes, r.fuelDate, this.formatDate(r.fuelDate)]
        .some(v => String(v || '').toLowerCase().includes(s))
    );
  }

  get filteredVehicleCount(): number {
    return new Set(this.filtered.map(r => r.vehicle).filter(Boolean)).size;
  }

  get filteredTotal(): number {
    return this.filtered.reduce((sum, r) => sum + (r.liters || 0), 0);
  }

  get tankPercent(): number {
    return this.tank.percent_full ?? 0;
  }

  get tankStatusClass(): string {
    return this.tankPercent < 25 ? 'tank-status--low'
         : this.tankPercent < 50 ? 'tank-status--mid'
         : 'tank-status--ok';
  }

  get tankStatusText(): string {
    return this.tankPercent < 25 ? '⚠ LOW — Refill Soon'
         : this.tankPercent < 50 ? '↓ Below Half'
         : '✓ Sufficient';
  }

  // ── SVG tank ───────────────────────────────────────────────────────────────

  get fuelColor(): string {
    return this.tankFillPercent > 50 ? '#22c55e'
         : this.tankFillPercent > 25 ? '#f59e0b'
         : '#ef4444';
  }

  get svgRectY(): number { return 12 + 176 * ((100 - this.tankFillPercent) / 100); }
  get svgRectH(): number { return 176 * (this.tankFillPercent / 100); }
  get svgPathD(): string {
    const y = this.svgRectY;
    return `M22,${y} Q50,${y - 6} 70,${y} Q90,${y + 6} 118,${y} L118,188 L22,188 Z`;
  }

  readonly svgMarkers = [25, 50, 75];
  markerY(lvl: number): number { return 12 + 176 * (1 - lvl / 100); }

  // ── bar chart ──────────────────────────────────────────────────────────────

  get monthlyData(): BarData[] {
    const today  = new Date();
    const months: BarData[] = [];

    for (let i = this.MONTHS - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ key: this.monthKey(d), month: this.monthLabel(d), liters: 0 });
    }

    const map = new Map(months.map(m => [m.key, { ...m }]));
    this.fuelRecords.forEach(r => {
      const d = new Date(r.fuelDate);
      if (isNaN(d.getTime())) return;
      const entry = map.get(this.monthKey(d));
      if (entry) entry.liters += r.liters || 0;
    });

    return months.map(m => map.get(m.key) || m);
  }

  get pagedRows(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filtered.length / this.PAGE_SIZE)); }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  get maxBarLiters(): number { return Math.max(...this.monthlyData.map(d => d.liters), 1); }

  barHeight(liters: number): number {
    return (liters / this.maxBarLiters) * 120;
  }

  isPeak(liters: number): boolean {
    return liters === this.maxBarLiters && this.maxBarLiters > 0;
  }

  barTopLabel(liters: number): string {
    if (liters <= 0) return '0';
    return liters >= 1000 ? `${(liters / 1000).toFixed(1)}k` : `${Math.round(liters)}`;
  }

  // ── KPI cards ──────────────────────────────────────────────────────────────

  get totalAllLiters(): number { return this.records.reduce((s, r) => s + (r.liters || 0), 0); }
  get totalFuelLiters(): number { return this.fuelRecords.reduce((s, r) => s + (r.liters || 0), 0); }

  get currentMonthLiters(): number {
    const key = this.monthKey(new Date());
    return this.monthlyData.find(m => m.key === key)?.liters || 0;
  }

  get avgPerFill(): number {
    return this.fuelRecords.length > 0
      ? Math.round(this.totalFuelLiters / this.fuelRecords.length)
      : 0;
  }

  get petrolShare(): number {
    return this.totalAllLiters > 0
      ? (this.totalFuelLiters / this.totalAllLiters) * 100
      : 0;
  }

  get kpiCards(): KpiCard[] {
    return [
      {
        label: 'Petrol Share', value: `${Math.round(this.petrolShare)}%`,
        sub: 'Of All Fuel Liters', icon: 'P',
        color: this.petrolShare > 50 ? '#22c55e' : this.petrolShare > 25 ? '#f59e0b' : '#ef4444'
      },
      { label: 'This Month',    value: `${this.formatNumber(this.currentMonthLiters)}L`, sub: 'Petrol Dispensed',  icon: 'M', color: '#3b82f6' },
      { label: 'Transactions',  value: this.fuelRecords.length,                          sub: 'Petrol Records',   icon: 'T', color: '#8b5cf6' },
      { label: 'Avg Per Fill',  value: `${this.formatNumber(this.avgPerFill)}L`,          sub: 'Petrol Only',      icon: 'A', color: '#f59e0b' },
    ];
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  avatarColor(index: number): string {
    return `hsl(${(index + 1) * 47 + 200}, 60%, 35%)`;
  }

  formatNumber(v: any): string {
    const n = Number(v);
    return isNaN(n) ? String(v || '-') : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  formatDate(v: any): string {
    if (!v) return '-';
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  }

  titleCase(v: string): string {
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Unknown';
  }

  private monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthLabel(d: Date): string {
    return d.toLocaleDateString('en-ZW', { month: 'short', year: '2-digit' });
  }
}

import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';

interface BarItem   { label: string; value: number; pct: number; }
interface MonthItem { key: string; label: string; diesel: number; petrol: number; total: number; barPct: number; }
interface KpiCard   { label: string; value: string | number; sub: string; tone: string; }

const MONTH_KEY   = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const MONTH_LABEL = (d: Date) => d.toLocaleDateString('en-ZW', { month: 'short', year: '2-digit' });

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {

  loading = true;
  error   = '';

  kpiCards:     KpiCard[]   = [];
  fuelTypeBars: BarItem[]   = [];
  roleBars:     BarItem[]   = [];
  monthlyTrend: MonthItem[] = [];

  dieselPct  = 0;
  petrolPct  = 0;
  approvedPct = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    forkJoin({
      users:   this.api.getUsers(),
      records: this.api.getFuelRecords()
    }).subscribe({
      next: ({ users, records }) => {
        this.buildCharts(users, records);
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message || 'Failed to load analytics data.';
        this.loading = false;
      }
    });
  }

  private buildCharts(users: any[], records: any[]): void {
    const dispensed = records.filter(r => ['MANAGER_APPROVED', 'ATTENDANT_APPROVED', 'SIGNED'].includes(String(r.status).toUpperCase()));
    const pending   = records.filter(r => String(r.status).toUpperCase() === 'PENDING');
    const declined  = records.filter(r => String(r.status).toUpperCase() === 'DECLINED');

    const diesel = dispensed.filter(r => String(r.fuelType).toLowerCase() === 'diesel');
    const petrol = dispensed.filter(r => String(r.fuelType).toLowerCase() === 'petrol');

    const totalL  = dispensed.reduce((s, r) => s + (r.liters || 0), 0);
    const dieselL = diesel.reduce((s, r) => s + (r.liters || 0), 0);
    const petrolL = petrol.reduce((s, r) => s + (r.liters || 0), 0);

    this.dieselPct   = totalL > 0 ? Math.round((dieselL / totalL) * 100) : 0;
    this.petrolPct   = totalL > 0 ? Math.round((petrolL / totalL) * 100) : 0;
    this.approvedPct = records.length > 0 ? Math.round((dispensed.length / records.length) * 100) : 0;

    // ── KPI cards ──────────────────────────────────────────────────────────────
    this.kpiCards = [
      { label: 'Total Records',     value: records.length,       sub: 'All fuel transactions',               tone: 'primary' },
      { label: 'Total Dispensed',   value: this.fmtL(totalL),    sub: 'Approved & signed litres',            tone: 'success' },
      { label: 'Pending Approval',  value: pending.length,       sub: `${declined.length} declined`,         tone: 'warning' },
      { label: 'Registered Users',  value: users.length,         sub: `${users.filter(u => u.isActive).length} active`, tone: 'accent' },
    ];

    // ── Fuel type split ────────────────────────────────────────────────────────
    const maxFL = Math.max(dieselL, petrolL, 1);
    this.fuelTypeBars = [
      { label: 'Diesel', value: dieselL, pct: Math.round((dieselL / maxFL) * 100) },
      { label: 'Petrol', value: petrolL, pct: Math.round((petrolL / maxFL) * 100) },
    ];

    // ── Role distribution ──────────────────────────────────────────────────────
    const roleOrder = ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER', 'ATTENDANT', 'FINANCE', 'DRIVER', 'USER'];
    const roleCounts = roleOrder.map(role => ({
      label: role.charAt(0) + role.slice(1).toLowerCase(),
      value: users.filter(u => String(u.role).toUpperCase() === role).length,
    }));
    const maxRC = Math.max(...roleCounts.map(r => r.value), 1);
    this.roleBars = roleCounts
      .filter(r => r.value > 0)
      .map(r => ({ ...r, pct: Math.round((r.value / maxRC) * 100) }));

    // ── Monthly trend (last 6 months) ──────────────────────────────────────────
    const today  = new Date();
    const months: MonthItem[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ key: MONTH_KEY(d), label: MONTH_LABEL(d), diesel: 0, petrol: 0, total: 0, barPct: 0 });
    }
    const monthMap = new Map(months.map(m => [m.key, m]));
    dispensed.forEach(r => {
      const d = new Date(r.fuelDate);
      if (isNaN(d.getTime())) return;
      const entry = monthMap.get(MONTH_KEY(d));
      if (!entry) return;
      const l = r.liters || 0;
      entry.total += l;
      if (String(r.fuelType).toLowerCase() === 'diesel') entry.diesel += l;
      else entry.petrol += l;
    });
    const maxM = Math.max(...months.map(m => m.total), 1);
    this.monthlyTrend = months.map(m => ({ ...m, barPct: Math.round((m.total / maxM) * 100) }));
  }

  private fmtL(v: number): string {
    return v >= 1000
      ? `${(v / 1000).toFixed(1)}kL`
      : `${v.toLocaleString()}L`;
  }

  fmtNum(v: number): string {
    return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}

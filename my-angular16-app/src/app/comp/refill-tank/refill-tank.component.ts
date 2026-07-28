import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-refill-tank',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './refill-tank.component.html',
  styleUrls: ['./refill-tank.component.css']
})
export class RefillTankComponent implements OnInit, OnDestroy {
  liters: string = '';
  fuelType: string = 'petrol';
  loading = false;
  error   = '';
  success = '';

  tank = { capacity: 10000, current_level: 0, percent_full: 0 };
  tankFillPercent = 0;
  tankLoading     = false;
  tankError       = '';
  private fillTimer: any;

  constructor(private api: ApiService) {}

  ngOnInit() { this.fetchTank(); }
  ngOnDestroy() { clearTimeout(this.fillTimer); }

  getTankId(): number {
    return this.fuelType === 'petrol' ? 1 : 2;
  }

  fetchTank() {
    this.tankLoading = true;
    this.tankError   = '';
    this.api.getTankById(this.getTankId()).subscribe({
      next: (data) => {
        this.tankLoading    = false;
        this.tank           = data;
        clearTimeout(this.fillTimer);
        this.fillTimer = setTimeout(() => { this.tankFillPercent = this.tank.percent_full; }, 300);
      },
      error: (err) => {
        this.tankLoading = false;
        this.tankError   = err?.error?.message || 'Tank data unavailable.';
      }
    });
  }

  handleSubmit() {
    if (!this.liters || Number(this.liters) <= 0) {
      this.error = 'Please enter a valid positive number of liters.';
      return;
    }

    this.error   = '';
    this.success = '';
    this.loading = true;

    this.api.refillTank(this.getTankId(), Number(this.liters)).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res?.message || `Added ${this.liters}L to ${this.fuelType} tank.`;
        this.liters  = '';
        this.fetchTank();
        setTimeout(() => { this.success = ''; }, 5000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Refill failed.';
      }
    });
  }

  setFuelType(type: string) {
    this.fuelType        = type;
    this.error           = '';
    this.success         = '';
    this.liters          = '';
    this.tankFillPercent = 0;
    this.fetchTank();
  }

  // ── SVG tank helpers ────────────────────────────────────────────────────────

  get fuelColor(): string {
    return this.tankFillPercent > 50 ? '#22c55e'
         : this.tankFillPercent > 25 ? '#f59e0b'
         : '#ef4444';
  }

  get tankStatusClass(): string {
    return this.tankFillPercent < 25 ? 'tank-status--low'
         : this.tankFillPercent < 50 ? 'tank-status--mid'
         : 'tank-status--ok';
  }

  get tankStatusText(): string {
    return this.tankFillPercent < 25 ? '⚠ LOW — Refill Soon'
         : this.tankFillPercent < 50 ? '↓ Below Half'
         : '✓ Sufficient';
  }

  get svgRectY(): number { return 12 + 176 * ((100 - this.tankFillPercent) / 100); }
  get svgRectH(): number { return 176 * (this.tankFillPercent / 100); }
  get svgPathD(): string {
    const y = this.svgRectY;
    return `M22,${y} Q50,${y - 6} 70,${y} Q90,${y + 6} 118,${y} L118,188 L22,188 Z`;
  }

  readonly svgMarkers = [25, 50, 75];
  markerY(lvl: number): number { return 12 + 176 * (1 - lvl / 100); }

  formatNumber(v: any): string {
    const n = Number(v);
    return isNaN(n) ? String(v || '-') : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}

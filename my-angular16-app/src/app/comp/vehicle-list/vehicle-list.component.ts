import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit {
  vehicles: any[] = [];
  sort = { key: '', dir: 'asc' };

  loading = false;
  error   = '';

  page             = 1;
  readonly PAGE_SIZE = 20;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchVehicles();
  }

  fetchVehicles() {
    this.loading = true;
    this.error   = '';

    this.api.getVehicles().subscribe({
      next: (vehicles) => {
        this.loading  = false;
        this.vehicles = vehicles;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load vehicles.';
      }
    });
  }

  handleSort(key: string) {
    this.sort = {
      key,
      dir: this.sort.key === key && this.sort.dir === 'asc' ? 'desc' : 'asc'
    };
    this.page = 1;
  }

  deleteVehicle(id: number) {
    if (!confirm('Delete this vehicle?')) return;
    this.api.deleteVehicle(id).subscribe({
      next: () => { this.vehicles = this.vehicles.filter(v => v.id !== id); },
      error: (err) => { alert(err?.error?.message || 'Delete failed.'); }
    });
  }

  get pagedVehicles(): any[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.sortedVehicles.slice(start, start + this.PAGE_SIZE);
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.vehicles.length / this.PAGE_SIZE)); }
  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  get sortedVehicles(): any[] {
    return [...this.vehicles].sort((a: any, b: any) => {
      if (!this.sort.key) return 0;
      const aVal = String(a[this.sort.key] ?? '').toLowerCase();
      const bVal = String(b[this.sort.key] ?? '').toLowerCase();
      if (aVal < bVal) return this.sort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sort.dir === 'asc' ?  1 : -1;
      return 0;
    });
  }
}

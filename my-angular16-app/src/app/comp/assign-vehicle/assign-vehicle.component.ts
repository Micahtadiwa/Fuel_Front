import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

interface Assignment {
  vehicle:    any;
  driverName: string;
  assignedBy:  string;
  department: string;
  fuelType:   string;
  liters:     number;
  mileage:    number;
  fuelDate:   string;
  notes:      string;
  status:     string;
}

@Component({
  selector: 'app-assign-vehicle',
  templateUrl: './assign-vehicle.component.html',
  styleUrls: ['./assign-vehicle.component.css']
})
export class AssignVehicleComponent implements OnInit {
  vehicles: any[] = [];
  users:    any[] = [];
  loading   = true;
  error     = '';

  selectedVehicleId: number | null = null;
  driverName  = '';
  department  = '';
  private get loggedInName(): string {
    const u = this.auth.getUser();
    return u?.username ?? u?.name ?? '';
  }
  fuelType    = '';
  liters      = 0;
  mileage     = 0;
  fuelDate    = new Date().toISOString().split('T')[0];
  notes       = '';

  saving      = false;
  success     = '';
  saveError   = '';
  showToast   = false;
  toastMsg    = '';
  private toastTimer: any;

  assignments: Assignment[] = [];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.driverName = this.loggedInName;

    this.api.getVehicles().subscribe({
      next: (vehicles) => { this.vehicles = vehicles; this.loading = false; },
      error: (err)     => { this.error = err?.error?.message || 'Failed to load vehicles.'; this.loading = false; }
    });

    this.api.getUsers().subscribe({
      next: (users) => { this.users = users; },
      error: ()     => {}
    });
  }

  get selectedVehicle(): any {
    return this.vehicles.find(v => v.id === this.selectedVehicleId) ?? null;
  }

  get assignedBy(): string {
    const user = this.auth.getUser();
    return user?.username ?? user?.name ?? 'User';
  }

  get canSubmit(): boolean {
    return this.selectedVehicleId != null &&
           this.driverName.trim().length > 0 &&
           this.department.trim().length > 0 &&
           this.fuelType.length > 0 &&
           this.liters > 0 &&
           this.fuelDate.length > 0 &&
           !this.saving;
  }

  handleSubmit(): void {
    if (!this.canSubmit) return;

    this.saving    = true;
    this.success   = '';
    this.saveError = '';

    const vehicle    = this.selectedVehicle;
    const driverName = this.driverName.trim();
    const department = this.department.trim();
    const fuelType   = this.fuelType;
    const liters     = this.liters;
    const mileage    = this.mileage;
    const fuelDate   = this.fuelDate;
    const notes      = this.notes.trim();
    const assignedBy = this.assignedBy;
    const assignedTo = driverName;

    this.api.assignVehicle(
      this.selectedVehicleId!, department,
      fuelType, liters, mileage, fuelDate, notes, assignedBy, assignedTo
    ).subscribe({
      next: (res) => {
        const status = String(res?.status ?? res?.data?.status ?? 'PENDING').toUpperCase();
        this.saving  = false;
        this.success = `${vehicle?.NumberPlate || 'Vehicle'} assigned to ${driverName} — ${liters}L ${fuelType} on ${fuelDate}. Status: ${status}.`;
        this.triggerToast(`Vehicle ${vehicle?.NumberPlate || ''} successfully assigned to ${driverName}`);
        this.assignments = [
          { vehicle, driverName, assignedBy, department, fuelType, liters, mileage, fuelDate, notes, status },
          ...this.assignments.filter(a => a.vehicle?.id !== vehicle?.id),
        ];
        this.selectedVehicleId = null;
        this.driverName        = this.loggedInName;
        this.department        = '';
        this.fuelType          = '';
        this.liters            = 0;
        this.mileage           = 0;
        this.fuelDate          = new Date().toISOString().split('T')[0];
        this.notes             = '';
      },
      error: (err) => {
        this.saving    = false;
        this.saveError = err?.error?.message || 'Failed to assign vehicle. Please try again.';
      }
    });
  }

  triggerToast(msg: string): void {
    clearTimeout(this.toastTimer);
    this.toastMsg  = msg;
    this.showToast = true;
    this.toastTimer = setTimeout(() => { this.showToast = false; }, 4000);
  }

  dismissToast(): void {
    clearTimeout(this.toastTimer);
    this.showToast = false;
  }

  clearForm(): void {
    this.selectedVehicleId = null;
    this.driverName        = this.loggedInName;
    this.department        = '';
    this.fuelType          = '';
    this.liters            = 0;
    this.mileage           = 0;
    this.fuelDate          = new Date().toISOString().split('T')[0];
    this.notes             = '';
    this.success           = '';
    this.saveError         = '';
  }
}

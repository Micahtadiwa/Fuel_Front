import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Auth ────────────────────────────────────────────────────────────────────

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/login`, { email, password });
  }

  getPendingUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/auth/pending-users`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : [];
        return list.map(u => this.mapUser(u));
      })
    );
  }

  approveUser(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/auth/users/${id}/approve`, {});
  }

  rejectUser(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/auth/users/${id}/reject`, {});
  }

  getLockedUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/auth/locked-users`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : [];
        return list.map(u => this.mapUser(u));
      })
    );
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/auth/users`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        return list.map(u => this.mapUser(u));
      })
    );
  }

  adminCreateUser(name: string, email: string, password: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/admin/users`, { name, email, password, role });
  }

  changeOwnPassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/auth/change-password`, { currentPassword, newPassword });
  }

  resetUserPassword(id: number, newPassword: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/auth/users/${id}/password`, { newPassword });
  }

  updateUserRole(id: number, role: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/auth/users/${id}/role`, { role });
  }

  updateUserActive(id: number, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.base}/auth/users/${id}/active`, { isActive });
  }

  // ── Vehicles ────────────────────────────────────────────────────────────────

  createVehicle(numberPlate: string, make: string, model: string, chassisNumber: string): Observable<any> {
    return this.http.post<any>(`${this.base}/vehicles`, { numberPlate, make, model, chassisNumber });
  }

  getVehicles(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/vehicles`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        return list.map(v => this.mapVehicle(v));
      })
    );
  }

  getVehicleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/vehicles/${id}`).pipe(
      map(res => this.mapVehicle(res?.data ?? res))
    );
  }

  updateVehicle(id: number, numberPlate: string, make: string, model: string, chassisNumber: string): Observable<any> {
    return this.http.put<any>(`${this.base}/vehicles/${id}`, { numberPlate, make, model, chassisNumber });
  }

  deleteVehicle(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/vehicles/${id}`);
  }

  getVehiclesForSelect(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/vehicles/select`);
  }

  assignVehicle(
    vehicleId:  number,
    department: string,
    fuelType:   string,
    liters:     number,
    mileage:    number,
    fuelDate:   string,
    notes:      string,
    assignedBy: string,
    assignedTo: string
  ): Observable<any> {
    return this.http.post<any>(`${this.base}/vehicles/${vehicleId}/assign`, {
      vehicle_id:     vehicleId,
      department,
      fuel_type:      fuelType,
      liters,
      mileage,
      fuel_date:      fuelDate,
      notes,
      user_name:      assignedTo,
      assignvehicles: assignedBy,
    });
  }

  // ── Fuel ────────────────────────────────────────────────────────────────────

  getFuelRecords(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/fuel`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        return list.map(r => this.mapFuelRecord(r));
      })
    );
  }

  updateFuelStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/fuel/${id}/status`, { status });
  }

  dispenseFuel(liters: number, fuelType: string): Observable<any> {
    return this.http.post<any>(`${this.base}/fuel/dispense`, { liters, fuel_type: fuelType });
  }

  refillTank(tankId: number, liters: number): Observable<any> {
    return this.http.post<any>(`${this.base}/fuel/tank/${tankId}/refill`, { liters });
  }

  getTankById(tankId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/fuel/tank/${tankId}`).pipe(
      map(res => this.mapTank(res))
    );
  }

  private mapTank(t: any): any {
    const capacity    = Number(t?.capacity     ?? t?.Capacity     ?? 10000);
    const currentLevel= Number(t?.currentLevel ?? t?.current_level ?? t?.CurrentLevel ?? 0);
    const percentFull = t?.percent_full != null
      ? Number(t.percent_full)
      : capacity > 0 ? (currentLevel / capacity) * 100 : 0;
    return { capacity, current_level: currentLevel, percent_full: percentFull };
  }

  getTankRefillHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/fuel/tank-refills`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : [];
        return list.map(r => ({
          id:           r?.id,
          tankId:       r?.tank_id    ?? r?.tankId    ?? null,
          fuelType:     (r?.fuelType  ?? r?.fuel_type ?? '').toLowerCase(),
          liters:       r?.litres     ?? r?.liters    ?? 0,
          balanceAfter: r?.balanceAfter ?? r?.balance_after ?? 0,
          reference:    r?.reference  ?? '',
          createdAt:    r?.createdAt  ?? r?.created_at ?? '',
          refilledBy:   r?.refilledBy ?? r?.refilled_by ?? 'System',
        }));
      })
    );
  }

  getTankRemovals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/fuel/tank-removals`).pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : [];
        return list.map(r => ({
          id:                  r?.id,
          fuelType:            (r?.fuelType   ?? r?.fuel_type   ?? '').toLowerCase(),
          liters:              r?.liters      ?? 0,
          mileage:             r?.mileage     ?? null,
          fuelDate:            r?.fuelDate    ?? r?.fuel_date   ?? '',
          notes:               r?.notes       ?? '',
          status:              (r?.status     ?? 'ATTENDANT_APPROVED').toUpperCase(),
          department:          r?.department  ?? '',
          submittedBy:         r?.submitted_by ?? r?.submittedBy ?? r?.assigned_by ?? r?.assignedBy ?? '',
          vehicle:             r?.vehicle     ?? '',
          approvedByManager:   r?.approvedByManager   ?? r?.approvedbymanager   ?? '',
          approvedByAttendant: r?.approvedByAttendant ?? r?.approvedbyattendant ?? '',
          signedByFinance:     r?.signedByFinance     ?? r?.signedbyfinance     ?? '',
        }));
      })
    );
  }

  // ── Mappers (API → local shape) ─────────────────────────────────────────────

  private mapUser(u: any): any {
    // DB column is "IsActive" (PascalCase tinyint); Jackson may return it as
    // IsActive, isActive, is_active, or active depending on the entity/DTO setup.
    const isActive = !!(u?.IsActive ?? u?.isActive ?? u?.is_active ?? u?.active);
    return {
      userId:               u?.UserID     ?? u?.userId     ?? u?.id,
      username:             u?.username   ?? u?.name       ?? '',
      email:                u?.email      ?? '',
      role:                 String(u?.role ?? 'USER').toUpperCase(),
      status:               u?.status     ?? '',
      department:           u?.department ?? '',
      isActive,
      failedLoginAttempts:  u?.failedLoginAttempts ?? 0,
      pendingApproval:      u?.pendingApproval ?? false,
    };
  }

  private mapVehicle(v: any): any {
    return {
      id: v?.id,
      NumberPlate: v?.numberPlate ?? v?.NumberPlate ?? '',
      make: v?.make ?? '',
      model: v?.model ?? '',
      ChassisNumber: v?.chassisNumber ?? v?.ChassisNumber ?? ''
    };
  }

  private mapFuelRecord(r: any): any {
    const vehicle = r?.vehicle;
    const vehicleNum = typeof vehicle === 'object'
      ? (vehicle?.numberPlate ?? vehicle?.NumberPlate ?? r?.vehicle_id)
      : (vehicle ?? r?.vehicle_id ?? '');

    return {
      id:         r?.id,
      vehicleId:  r?.vehicle_id  ?? r?.vehicleId  ?? null,
      vehicle:    vehicleNum,
      userId:     r?.user_id     ?? r?.userId      ?? null,
      driver:     r?.user_name   ?? r?.userName    ?? '',
      submittedBy: r?.assignvehicles ?? r?.submitted_by ?? r?.submittedBy ?? r?.assigned_by ?? r?.assignedBy ?? '',
      department: r?.department  ?? '',
      fuelType:   (r?.fuel_type  ?? r?.fuelType    ?? '').toLowerCase(),
      liters:     r?.liters      ?? 0,
      mileage:    r?.mileage     ?? 0,
      fuelDate:   r?.fuel_date   ?? r?.fuelDate    ?? '',
      status:              (r?.status     ?? 'PENDING').toUpperCase(),
      notes:               r?.notes       ?? '',
      createdAt:           r?.created_at  ?? r?.createdAt   ?? '',
      updatedAt:           r?.updated_at  ?? r?.updatedAt   ?? '',
      approvedByManager:   r?.approvedByManager   ?? r?.approvedbymanager   ?? '',
      approvedByAttendant: r?.approvedByAttendant ?? r?.approvedbyattendant ?? '',
      signedByFinance:     r?.signedByFinance     ?? r?.signedbyfinance     ?? '',
    };
  }
}

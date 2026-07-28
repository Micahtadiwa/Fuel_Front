export type UserRole = 'Admin' | 'Manager' | 'Attendant' | 'Finance' | 'Driver' | 'User';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

export interface ChartUser {
  id: number;
  role: string;
  status: string;
}

export interface ChartItem {
  label: string;
  value: number;
  fill: string;
}

export interface Summary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  peakRole: string;
}

export interface SummaryCard {
  label: string;
  value: number | string;
  tone: string;
}

export interface RoleChartItem {
  label: UserRole;
  value: number;
  fill: string;
}

export interface TrendItem {
  label: string;
  total: number;
  active: number;
  inactive: number;
  fill: string;
}


export interface Vehicle {
  NumberPlate: string;
  make: string;
  model: string;
  ChassisNumber: string;
}

export interface FuelRecord {
  id: number;
  vehicle: string;
  driver: string;
  fuelType: 'petrol' | 'diesel';
  liters: number;
  mileage: number;
  fuelDate: string;
  status: string;
  notes: string;
}
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UsersComponent } from './components/users/users.component';
import { VehiclesComponent } from './components/vehicles/vehicles.component';
import { AttendantComponent } from './components/attendant/attendant.component';
import { SignupComponent } from './signup/signup.component';
import { MainComponent } from './components/main/main.component';
import { DeclinedusersComponent } from './comp/declinedusers/declinedusers.component';
import { EditroleComponent } from './comp/editrole/editrole.component';
import { UserdataComponent } from './comp/userdata/userdata.component';
import { ChartsComponent } from './comp/charts/charts.component';
import { AddVehicleComponent } from './comp/add-vehicle/add-vehicle.component';
import { VehicleListComponent } from './comp/vehicle-list/vehicle-list.component';
import { AssignVehicleComponent } from './comp/assign-vehicle/assign-vehicle.component';
import { RefillTankComponent } from './comp/refill-tank/refill-tank.component';
import { ReportsComponent } from './comp/reports/reports.component';
import { AuthorizeFuelComponent } from './comp/authorize-fuel/authorize-fuel.component';
import { ManagerComponent } from './components/manager/manager.component';
import { UnauthorizedComponent } from './comp/unauthorized/unauthorized.component';
import { FuelRemovalsComponent } from './comp/fuel-removals/fuel-removals.component';
import { PetroltankComponent } from './comp/petroltank/petroltank.component';
import { DieseltankComponent } from './comp/dieseltank/dieseltank.component';
import { TankRefillHistoryComponent } from './comp/tank-refill-history/tank-refill-history.component';
import { CreateUserComponent } from './comp/create-user/create-user.component';
import { ChangePasswordComponent } from './comp/change-password/change-password.component';
import { LockedUsersComponent } from './comp/locked-users/locked-users.component';
import { PendingUsersComponent } from './comp/pending-users/pending-users.component';
import { roleGuard } from './guards/role.guard';

const ALL_ROLES = ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER', 'ATTENDANT', 'FINANCE', 'DRIVER', 'USER'];

const routes: Routes = [
  { path: '',      redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: SignupComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // MainComponent is the layout shellmanager
  {
    path: '',
    component: MainComponent,
    children: [
      { path: 'dashboard',      component: DashboardComponent,   canActivate: [roleGuard], data: { roles: ['MANAGER', 'ATTENDANT', 'FINANCE', 'DRIVER', 'USER', 'ADMIN_MAKER', 'ADMIN_CHECKER'] } },
      { path: 'users',          component: UsersComponent,       canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER', 'ADMIN_CHECKER'] } },
      { path: 'vehicles',       component: VehiclesComponent,    canActivate: [roleGuard], data: { roles: ['MANAGER'] } },
      { path: 'manager',        component: ManagerComponent,     canActivate: [roleGuard], data: { roles: ['MANAGER', 'ADMIN_MAKER'] } },
      { path: 'attendant',      component: AttendantComponent,   canActivate: [roleGuard], data: { roles: ['ATTENDANT'] } },
      { path: 'declinedusers',  component: DeclinedusersComponent, canActivate: [roleGuard], data: { roles: ['MANAGER'] } },
      { path: 'editrole',       component: EditroleComponent,    canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER'] } },
      { path: 'editrole/:id',   component: EditroleComponent,    canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER'] } },
      { path: 'create-user',    component: CreateUserComponent,  canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER'] } },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER'] } },
      { path: 'locked-users',    component: LockedUsersComponent,    canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER', 'ADMIN_CHECKER'] } },
      { path: 'pending-users',   component: PendingUsersComponent,   canActivate: [roleGuard], data: { roles: ['ADMIN_CHECKER'] } },
      { path: 'userdata',       component: UserdataComponent,    canActivate: [roleGuard], data: { roles: ['ADMIN_MAKER', 'ADMIN_CHECKER', 'MANAGER'] } },
      { path: 'add-vehicles',   component: AddVehicleComponent,  canActivate: [roleGuard], data: { roles: ['MANAGER'] } },
      { path: 'vehicles-list',  component: VehicleListComponent, canActivate: [roleGuard], data: { roles: ['MANAGER'] } },
      { path: 'assign-vehicle', component: AssignVehicleComponent, canActivate: [roleGuard], data: { roles: ['DRIVER', 'ADMIN_MAKER'] } },
      { path: 'charts',         component: ChartsComponent,      canActivate: [roleGuard], data: { roles: ['MANAGER', 'FINANCE', 'ADMIN_MAKER', 'ADMIN_CHECKER'] } },
      { path: 'refill-tanks',   component: RefillTankComponent,    canActivate: [roleGuard], data: { roles: ['ATTENDANT', 'ADMIN_MAKER'] } },
      { path: 'tank-refills',   component: TankRefillHistoryComponent, canActivate: [roleGuard], data: { roles: ['ATTENDANT', 'MANAGER', 'FINANCE', 'ADMIN_MAKER', 'ADMIN_CHECKER'] } },
      { path: 'petrol-tank',    component: PetroltankComponent,  canActivate: [roleGuard], data: { roles: ['MANAGER', 'ATTENDANT'] } },
      { path: 'diesel-tank',    component: DieseltankComponent,  canActivate: [roleGuard], data: { roles: ['MANAGER', 'ATTENDANT'] } },
      { path: 'reports',        component: ReportsComponent,     canActivate: [roleGuard], data: { roles: ['MANAGER', 'ATTENDANT', 'FINANCE'] } },
      { path: 'fuel-removals',  component: FuelRemovalsComponent, canActivate: [roleGuard], data: { roles: ['MANAGER', 'ATTENDANT'] } },
      { path: 'authorize',      component: AuthorizeFuelComponent, canActivate: [roleGuard], data: { roles: ['FINANCE'] } },

    ]
  },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AppComponent } from './app.component';
import { SignupComponent } from './signup/signup.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { VehiclesComponent } from './components/vehicles/vehicles.component';
import { UsersComponent } from './components/users/users.component';
import { AttendantComponent } from './components/attendant/attendant.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MainComponent } from './components/main/main.component';
import { UserdataComponent } from './comp/userdata/userdata.component';
import { ChartsComponent } from './comp/charts/charts.component';
import { EditroleComponent } from './comp/editrole/editrole.component';
import { DeclinedusersComponent } from './comp/declinedusers/declinedusers.component';
import { AddVehicleComponent } from './comp/add-vehicle/add-vehicle.component';
import { ReportsComponent } from './comp/reports/reports.component';
import { AuthorizeFuelComponent } from './comp/authorize-fuel/authorize-fuel.component';
import { RefillTankComponent } from './comp/refill-tank/refill-tank.component';
import { PetroltankComponent } from './comp/petroltank/petroltank.component';
import { DieseltankComponent } from './comp/dieseltank/dieseltank.component';
import { DieselrefillComponent } from './comp/dieselrefill/dieselrefill.component';
import { PetrolrefillComponent } from './comp/petrolrefill/petrolrefill.component';
import { VehicleListComponent } from './comp/vehicle-list/vehicle-list.component';
import { AssignVehicleComponent } from './comp/assign-vehicle/assign-vehicle.component';
import { ManagerComponent } from './components/manager/manager.component';
import { UnauthorizedComponent } from './comp/unauthorized/unauthorized.component';
import { FuelRemovalsComponent } from './comp/fuel-removals/fuel-removals.component';
import { TankRefillHistoryComponent } from './comp/tank-refill-history/tank-refill-history.component';
import { CreateUserComponent } from './comp/create-user/create-user.component';
import { ChangePasswordComponent } from './comp/change-password/change-password.component';
import { LockedUsersComponent } from './comp/locked-users/locked-users.component';
import { PendingUsersComponent } from './comp/pending-users/pending-users.component';

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    UsersComponent,
    DashboardComponent,
    MainComponent,
    ChartsComponent,
    EditroleComponent,
    DeclinedusersComponent,
    AddVehicleComponent,
    AuthorizeFuelComponent,
    PetroltankComponent,
    DieseltankComponent,
    DieselrefillComponent,
    PetrolrefillComponent,
    VehicleListComponent,
    AssignVehicleComponent,
    ManagerComponent,
    UnauthorizedComponent,
    CreateUserComponent,
    ChangePasswordComponent,
    LockedUsersComponent,
    PendingUsersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
     AttendantComponent,
     RefillTankComponent,
     UserdataComponent,
     ReportsComponent,
     VehiclesComponent,
      SidebarComponent,
     FuelRemovalsComponent,
     TankRefillHistoryComponent
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

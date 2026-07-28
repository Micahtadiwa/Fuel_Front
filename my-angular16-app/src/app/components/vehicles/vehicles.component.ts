import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent {

  constructor(private router: Router, private auth: AuthService) {}

  get isAdmin(): boolean { return this.auth.getUserRole() === 'ADMIN_MAKER'; }

  handleAddVehicle() {
    this.router.navigate(['/add-vehicles']);
  }

  handleViewVehicles() {
    this.router.navigate(['/vehicles-list']);
  }

  handleAssignVehicle() {
    this.router.navigate(['/assign-vehicle']);
  }
}
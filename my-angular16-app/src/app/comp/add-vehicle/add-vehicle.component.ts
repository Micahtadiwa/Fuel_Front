import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-vehicle',
  templateUrl: './add-vehicle.component.html',
  styleUrls: ['./add-vehicle.component.css']
})
export class AddVehicleComponent {
  vehicle = { NumberPlate: '', make: '', model: '', ChassisNumber: '' };

  loading = false;
  error   = '';
  success = '';

  constructor(private api: ApiService, private router: Router) {}

  handleSubmit() {
    const { NumberPlate, make, model, ChassisNumber } = this.vehicle;

    if (!NumberPlate || !make || !model || !ChassisNumber) {
      this.error = 'Please fill in all fields.';
      return;
    }

    this.loading = true;
    this.error   = '';
    this.success = '';

    this.api.createVehicle(NumberPlate, make, model, ChassisNumber).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res?.message || 'Vehicle added successfully!';
        this.vehicle = { NumberPlate: '', make: '', model: '', ChassisNumber: '' };
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to add vehicle.';
      }
    });
  }
}

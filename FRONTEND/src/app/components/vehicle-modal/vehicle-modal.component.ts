import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  licensePlate: string;
  year: number;
  capacity: number;
  maxWeight: number;
  dimensions: string;
  insurance: string;
  isActive: boolean;
}

@Component({
  selector: 'app-vehicle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-modal.component.html',
  styleUrls: ['./vehicle-modal.component.css']
})
export class VehicleModalComponent implements OnInit {
  @Input() vehicle: Vehicle | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Vehicle>();

  // Form data
  formData = {
    brand: '',
    model: '',
    type: 'Transporter',
    licensePlate: '',
    year: new Date().getFullYear(),
    maxWeight: 0,
    length: 0,
    width: 0,
    height: 0,
    insurance: 'Vollkasko',
    isActive: true
  };

  vehicleTypes = ['PKW', 'Transporter', 'Kastenwagen', 'Sprinter', 'LKW'];
  insuranceTypes = ['Haftpflicht', 'Teilkasko', 'Vollkasko'];

  ngOnInit(): void {
    if (this.vehicle) {
      // Edit mode - parse existing data
      const dims = this.vehicle.dimensions.split(' x ').map(d => parseInt(d));
      this.formData = {
        brand: this.vehicle.name.split(' ')[0] || '',
        model: this.vehicle.name.split(' ').slice(1).join(' ') || '',
        type: this.vehicle.type,
        licensePlate: this.vehicle.licensePlate,
        year: this.vehicle.year,
        maxWeight: this.vehicle.maxWeight,
        length: dims[0] || 0,
        width: dims[1] || 0,
        height: dims[2] || 0,
        insurance: this.vehicle.insurance.replace('✓ ', ''),
        isActive: this.vehicle.isActive
      };
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    // Calculate capacity
    const capacity = (this.formData.length * this.formData.width * this.formData.height) / 1000000;

    const vehicle: Vehicle = {
      id: this.vehicle?.id || Date.now().toString(),
      name: `${this.formData.brand} ${this.formData.model}`,
      type: this.formData.type,
      licensePlate: this.formData.licensePlate,
      year: this.formData.year,
      capacity: Math.round(capacity * 10) / 10,
      maxWeight: this.formData.maxWeight,
      dimensions: `${this.formData.length} x ${this.formData.width} x ${this.formData.height} cm`,
      insurance: `✓ ${this.formData.insurance}`,
      isActive: this.formData.isActive
    };

    this.save.emit(vehicle);
  }

  get isEditMode(): boolean {
    return !!this.vehicle;
  }
}

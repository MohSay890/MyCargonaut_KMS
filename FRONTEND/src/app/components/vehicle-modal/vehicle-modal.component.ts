import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vehicle } from '../../services/vehicle.service';

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
  @Output() save = new EventEmitter<Partial<Vehicle>>();

  // Error message
  errorMessage: string | null = null;

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
      const dims = (this.vehicle.dimensions || '0 x 0 x 0').split(' x ').map(d => parseInt(d));
      const nameParts = (this.vehicle.name || '').split(' ');
      this.formData = {
        brand: nameParts[0] || '',
        model: nameParts.slice(1).join(' ') || '',
        type: this.vehicle.type || 'Transporter',
        licensePlate: this.vehicle.licensePlate || '',
        year: this.vehicle.year || new Date().getFullYear(),
        maxWeight: this.vehicle.maxWeight || 0,
        length: dims[0] || 0,
        width: dims[1] || 0,
        height: dims[2] || 0,
        insurance: (this.vehicle.insurance || 'Vollkasko').replace('✓ ', ''),
        isActive: this.vehicle.isActive !== undefined ? this.vehicle.isActive : true
      };
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    // Validate all required fields
    if (!this.formData.brand || !this.formData.brand.trim()) {
      this.errorMessage = 'Bitte gib die Marke des Fahrzeugs ein.';
      return;
    }
    if (!this.formData.model || !this.formData.model.trim()) {
      this.errorMessage = 'Bitte gib das Modell des Fahrzeugs ein.';
      return;
    }
    if (!this.formData.type) {
      this.errorMessage = 'Bitte wähle einen Fahrzeugtyp aus.';
      return;
    }
    if (!this.formData.licensePlate || !this.formData.licensePlate.trim()) {
      this.errorMessage = 'Bitte gib das Kennzeichen ein.';
      return;
    }
    if (!this.formData.year || this.formData.year < 1900 || this.formData.year > 2025) {
      this.errorMessage = 'Bitte gib ein gültiges Baujahr ein (1900-2025).';
      return;
    }
    if (!this.formData.maxWeight || this.formData.maxWeight <= 0) {
      this.errorMessage = 'Bitte gib das maximale Gewicht ein (größer als 0).';
      return;
    }
    if (!this.formData.length || this.formData.length <= 0) {
      this.errorMessage = 'Bitte gib die Länge der Ladefläche ein (größer als 0).';
      return;
    }
    if (!this.formData.width || this.formData.width <= 0) {
      this.errorMessage = 'Bitte gib die Breite der Ladefläche ein (größer als 0).';
      return;
    }
    if (!this.formData.height || this.formData.height <= 0) {
      this.errorMessage = 'Bitte gib die Höhe der Ladefläche ein (größer als 0).';
      return;
    }
    if (!this.formData.insurance) {
      this.errorMessage = 'Bitte wähle eine Versicherung aus.';
      return;
    }

    // Clear error message if validation passes
    this.errorMessage = null;

    // Calculate capacity in m³
    const capacity = (this.formData.length * this.formData.width * this.formData.height) / 1000000;

    const vehicleData: Partial<Vehicle> = {
      name: `${this.formData.brand} ${this.formData.model}`.trim(),
      type: this.formData.type,
      licensePlate: this.formData.licensePlate,
      year: this.formData.year,
      capacity: Math.round(capacity * 10) / 10,
      maxWeight: this.formData.maxWeight,
      dimensions: `${this.formData.length} x ${this.formData.width} x ${this.formData.height} cm`,
      insurance: `✓ ${this.formData.insurance}`,
      isActive: this.formData.isActive
    };

    this.save.emit(vehicleData);
  }

  get isEditMode(): boolean {
    return !!this.vehicle;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicle, VehicleType, InsuranceType } from '../../models/cargonaut.model';

@Component({
  selector: 'app-vehicle-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-editor.component.html',
  styleUrls: ['./vehicle-editor.component.css']
})
export class VehicleEditorComponent implements OnInit {

  isEditMode: boolean = false;

  // Mock vehicle list
  vehicles: Vehicle[] = [
    {
      id: '1',
      type: VehicleType.TRANSPORTER,
      brand: 'Mercedes',
      model: 'Sprinter',
      licensePlate: 'B-XX 1234',
      year: 2020,
      loadCapacity: 1200,
      dimensions: { length: 320, width: 180, height: 180 },
      insurance: InsuranceType.VOLLKASKO,
      isActive: true,
      createdAt: new Date('2023-01-15')
    },
    {
      id: '2',
      type: VehicleType.PKW,
      brand: 'VW',
      model: 'Passat Variant',
      licensePlate: 'B-YY 5678',
      year: 2019,
      loadCapacity: 600,
      dimensions: { length: 200, width: 140, height: 120 },
      insurance: InsuranceType.TEILKASKO,
      isActive: true,
      createdAt: new Date('2023-03-20')
    },
    {
      id: '3',
      type: VehicleType.LKW,
      brand: 'MAN',
      model: 'TGL',
      licensePlate: 'B-ZZ 9012',
      year: 2021,
      loadCapacity: 3500,
      dimensions: { length: 600, width: 240, height: 260 },
      insurance: InsuranceType.VOLLKASKO,
      isActive: false,
      createdAt: new Date('2023-06-10')
    }
  ];

  newVehicle: Partial<Vehicle> = {
    type: undefined,
    brand: '',
    model: '',
    licensePlate: '',
    year: new Date().getFullYear(),
    loadCapacity: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    insurance: undefined,
    isActive: true
  };

  ngOnInit(): void {
    console.log('Vehicle Editor loaded with', this.vehicles.length, 'vehicles');
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.isEditMode) {
      console.log('Update vehicle:', this.newVehicle);
      // TODO: Update vehicle in backend
    } else {
      console.log('Create vehicle:', this.newVehicle);
      // TODO: Create vehicle in backend
      alert('Fahrzeug hinzugefügt! (TODO: Backend-Integration)');
    }
  }

  /**
   * Edit existing vehicle
   */
  onEdit(vehicle: Vehicle): void {
    this.isEditMode = true;
    this.newVehicle = { ...vehicle };
    console.log('Edit vehicle:', vehicle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Delete vehicle
   */
  onDelete(vehicleId: string): void {
    if (confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) {
      this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
      console.log('Delete vehicle:', vehicleId);
      // TODO: Delete from backend
    }
  }

  /**
   * Cancel form
   */
  onCancel(): void {
    this.isEditMode = false;
    this.newVehicle = {
      type: undefined,
      brand: '',
      model: '',
      licensePlate: '',
      year: new Date().getFullYear(),
      loadCapacity: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      insurance: undefined,
      isActive: true
    };
  }
}

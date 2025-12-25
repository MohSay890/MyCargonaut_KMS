import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { VehicleModalComponent } from '../vehicle-modal/vehicle-modal.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

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
  selector: 'app-vehicle-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, VehicleModalComponent, ConfirmationModalComponent],
  templateUrl: './vehicle-editor.component.html',
  styleUrls: ['./vehicle-editor.component.css']
})
export class VehicleEditorComponent implements OnInit {

  // Modal state
  isModalOpen = false;
  selectedVehicle: Vehicle | null = null;

  // Delete Modal state
  showDeleteModal = false;
  vehicleToDelete: Vehicle | null = null;

  // Mock data
  vehicles: Vehicle[] = [
    {
      id: '1',
      name: 'Mercedes Sprinter',
      type: 'Transporter',
      licensePlate: 'B-XX 1234',
      year: 2020,
      capacity: 10.4,
      maxWeight: 1200,
      dimensions: '320 x 180 x 180 cm',
      insurance: '✓ Vollkasko',
      isActive: true
    },
    {
      id: '2',
      name: 'VW Passat Kombi',
      type: 'PKW',
      licensePlate: 'B-YY 5678',
      year: 2019,
      capacity: 1.7,
      maxWeight: 500,
      dimensions: '180 x 120 x 80 cm',
      insurance: '✓ Teilkasko',
      isActive: true
    },
    {
      id: '3',
      name: 'Ford Transit',
      type: 'Transporter',
      licensePlate: 'B-ZZ 9012',
      year: 2018,
      capacity: 8.4,
      maxWeight: 1000,
      dimensions: '290 x 170 x 170 cm',
      insurance: '✓ Haftpflicht',
      isActive: false
    }
  ];

  ngOnInit(): void {
    console.log('Vehicle Editor loaded with', this.vehicles.length, 'vehicles');
  }

  /**
   * Add new vehicle - open modal
   */
  onAddVehicle(): void {
    console.log('ADD VEHICLE CLICKED');
    this.selectedVehicle = null;
    this.isModalOpen = true;
    console.log('isModalOpen:', this.isModalOpen);
  }

  /**
   * Edit vehicle - open modal with data
   */
  onEditVehicle(vehicle: Vehicle): void {
    console.log('Edit vehicle clicked:', vehicle);
    this.selectedVehicle = vehicle;
    this.isModalOpen = true;
  }

  /**
   * Delete vehicle - open confirmation modal
   */
  onDeleteVehicle(vehicle: Vehicle): void {
    console.log('Delete vehicle clicked:', vehicle);
    this.vehicleToDelete = vehicle;
    this.showDeleteModal = true;
  }

  /**
   * Confirm deletion
   */
  onConfirmDelete(): void {
    console.log('Confirm delete');
    if (this.vehicleToDelete) {
      this.vehicles = this.vehicles.filter(v => v.id !== this.vehicleToDelete!.id);
      console.log('Vehicle deleted:', this.vehicleToDelete.id);
    }
    this.showDeleteModal = false;
    this.vehicleToDelete = null;
  }

  /**
   * Cancel deletion
   */
  onCancelDelete(): void {
    console.log('Cancel delete');
    this.showDeleteModal = false;
    this.vehicleToDelete = null;
  }

  /**
   * Close modal
   */
  onModalClose(): void {
    console.log('Modal closed');
    this.isModalOpen = false;
    this.selectedVehicle = null;
  }

  /**
   * Save vehicle from modal
   */
  onModalSave(vehicle: Vehicle): void {
    console.log('Save vehicle:', vehicle);
    if (this.selectedVehicle) {
      // Edit mode - update existing vehicle
      const index = this.vehicles.findIndex(v => v.id === vehicle.id);
      if (index !== -1) {
        this.vehicles[index] = vehicle;
        console.log('Vehicle updated:', vehicle);
      }
    } else {
      // Add mode - add new vehicle
      vehicle.id = Date.now().toString(); // Generate simple ID
      this.vehicles.push(vehicle);
      console.log('Vehicle added:', vehicle);
    }

    this.onModalClose();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { VehicleModalComponent } from '../vehicle-modal/vehicle-modal.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { VehicleService, Vehicle } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-editor',
  standalone: true,
  imports: [CommonModule, SidebarComponent, VehicleModalComponent, ConfirmationModalComponent],
  templateUrl: './vehicle-editor.component.html',
  styleUrls: ['./vehicle-editor.component.css']
})
export class VehicleEditorComponent implements OnInit, OnDestroy {

  // Modal state
  isModalOpen = false;
  selectedVehicle: Vehicle | null = null;

  // Delete Modal state
  showDeleteModal = false;
  vehicleToDelete: Vehicle | null = null;

  // Error/Success messages
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Vehicles from service
  vehicles: Vehicle[] = [];

  // Subscription cleanup
  private vehiclesSub: Subscription | null = null;

  constructor(
    private vehicleService: VehicleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!localStorage.getItem('authToken')) {
      this.router.navigate(['/login']);
      return;
    }

    // Subscribe to vehicles changes - show all vehicles (active and inactive)
    this.vehiclesSub = this.vehicleService.vehicles$.subscribe(vehicles => {
      this.vehicles = vehicles;
      console.log('All vehicles loaded:', this.vehicles.length);
    });

    // Initial load
    this.vehicleService.loadVehiclesForCurrentUser();
  }

  ngOnDestroy(): void {
    if (this.vehiclesSub) {
      this.vehiclesSub.unsubscribe();
    }
  }

  // Helper method to get vehicle counts
  get vehicleStats() {
    return this.vehicleService.getVehicleCount();
  }

  /**
   * Clear messages after timeout
   */
  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.errorMessage = null;
      this.successMessage = null;
    }, 4000);
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
   * Toggle vehicle active status
   */
  onToggleActive(vehicle: Vehicle): void {
    console.log('Toggle active clicked:', vehicle);
    if (!vehicle.id) {
      this.errorMessage = 'Fahrzeug-ID nicht gefunden.';
      this.clearMessagesAfterDelay();
      return;
    }

    this.vehicleService.toggleVehicleActive(vehicle.id).subscribe(result => {
      if (result.success) {
        this.successMessage = result.isActive
          ? `${vehicle.name} wurde aktiviert.`
          : `${vehicle.name} wurde deaktiviert.`;
        this.clearMessagesAfterDelay();
      } else {
        this.errorMessage = result.error || 'Fehler beim Ändern des Status.';
        this.clearMessagesAfterDelay();
      }
    });
  }

  /**
   * Confirm deletion
   */
  onConfirmDelete(): void {
    console.log('Confirm delete');
    if (this.vehicleToDelete) {
      const vehicleName = this.vehicleToDelete.name;
      this.vehicleService.deleteVehicle(this.vehicleToDelete.id!).subscribe(result => {
        if (result.success) {
          this.successMessage = `${vehicleName} wurde erfolgreich gelöscht.`;
          this.clearMessagesAfterDelay();
        } else {
          this.errorMessage = result.error || 'Fehler beim Löschen.';
          this.clearMessagesAfterDelay();
        }
      });
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
  onModalSave(vehicleData: any): void {
    console.log('Save vehicle:', vehicleData);

    if (this.selectedVehicle) {
      // Edit mode - update existing vehicle
      this.vehicleService.updateVehicle(this.selectedVehicle.id!, vehicleData).subscribe(result => {
        if (result.success) {
          this.successMessage = `${vehicleData.name} wurde erfolgreich aktualisiert.`;
          this.clearMessagesAfterDelay();
        } else {
          this.errorMessage = result.error || 'Fehler beim Speichern.';
          this.clearMessagesAfterDelay();
        }
        this.onModalClose();
      });
    } else {
      // Add mode - create new vehicle
      this.vehicleService.createVehicle(vehicleData).subscribe(result => {
        if (result.success) {
          this.successMessage = `${vehicleData.name} wurde erfolgreich hinzugefügt.`;
          this.clearMessagesAfterDelay();
        } else {
          this.errorMessage = result.error || 'Fehler beim Erstellen.';
          this.clearMessagesAfterDelay();
        }
        this.onModalClose();
      });
    }
  }
}

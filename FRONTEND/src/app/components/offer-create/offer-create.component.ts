import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { OfferService } from '../../services/offer.service';
import { AuthService } from '../../services/auth.service';

interface Vehicle {
  id: string;
  type: string;
  model: string;
  plate: string;
  maxWeight: number;
}

interface OfferFormData {
  // Step 1: Route & Date
  from: string;
  to: string;
  date: string;
  time: string;
  distance: string;
  duration: string;

  // Step 2: Vehicle & Capacity
  vehicleId: string;
  vehicleType: string;
  vehicleModel: string;
  maxWeight: number;
  dimensions: string;
  capacity: string;

  // Step 3: Price & Details
  price: number;
  description: string;
  tags: string[];
  pickupLocation: string;
  dropoffLocation: string;

  // Additional
  verified: {
    id: boolean;
    license: boolean;
    phone: boolean;
  };
}

@Component({
  selector: 'app-offer-create',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './offer-create.component.html',
  styleUrls: ['./offer-create.component.css']
})
export class OfferCreateComponent implements OnInit {

  currentStep: number = 1;
  totalSteps: number = 4;

  // Form Data
  formData: OfferFormData = {
    from: '',
    to: '',
    date: '',
    time: '',
    distance: '',
    duration: '',
    vehicleId: '',
    vehicleType: '',
    vehicleModel: '',
    maxWeight: 0,
    dimensions: '',
    capacity: '',
    price: 0,
    description: '',
    tags: [],
    pickupLocation: '',
    dropoffLocation: '',
    verified: {
      id: true,
      license: true,
      phone: true
    }
  };

  // Available vehicles (from user's vehicles)
  vehicles: Vehicle[] = [
    { id: '1', type: 'Transporter', model: 'Mercedes Sprinter', plate: 'B-AB 1234', maxWeight: 1000 },
    { id: '2', type: 'PKW', model: 'VW Passat Kombi', plate: 'M-CD 5678', maxWeight: 500 },
    { id: '3', type: 'Kastenwagen', model: 'Ford Transit', plate: 'K-EF 9012', maxWeight: 800 }
  ];

  // Available tags
  availableTags: string[] = [
    'Versicherung inkl.',
    'Be-/Entladehilfe',
    'Express',
    'Flexible Zeiten',
    'Kühlmöglichkeit',
    'Ladungssicherung'
  ];

  // Modal
  showSuccessModal: boolean = false;

  constructor(
    private router: Router,
    private offerService: OfferService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.formData.date = tomorrow.toISOString().split('T')[0];
    this.formData.time = '08:00';
  }

  // Navigation
  nextStep(): void {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        window.scrollTo(0, 0);
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.validateStep(this.currentStep)) {
      this.currentStep = step;
      window.scrollTo(0, 0);
    }
  }

  // Validation
  validateStep(step: number): boolean {
    switch(step) {
      case 1:
        if (!this.formData.from || !this.formData.to || !this.formData.date || !this.formData.time) {
          alert('Bitte fülle alle Pflichtfelder aus (Von, Nach, Datum, Uhrzeit)');
          return false;
        }
        return true;

      case 2:
        if (!this.formData.vehicleId || !this.formData.maxWeight || !this.formData.dimensions) {
          alert('Bitte wähle ein Fahrzeug und fülle alle Felder aus');
          return false;
        }
        return true;

      case 3:
        if (!this.formData.price || this.formData.price <= 0) {
          alert('Bitte gib einen gültigen Preis ein');
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  // Vehicle Selection
  selectVehicle(vehicle: Vehicle): void {
    this.formData.vehicleId = vehicle.id;
    this.formData.vehicleType = vehicle.type;
    this.formData.vehicleModel = vehicle.model;
    this.formData.maxWeight = vehicle.maxWeight;
  }

  isVehicleSelected(vehicleId: string): boolean {
    return this.formData.vehicleId === vehicleId;
  }

  // Tag Selection
  toggleTag(tag: string): void {
    const index = this.formData.tags.indexOf(tag);
    if (index > -1) {
      this.formData.tags.splice(index, 1);
    } else {
      this.formData.tags.push(tag);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.formData.tags.includes(tag);
  }

  // Auto-calculate
  onRouteChange(): void {
    // Simple distance calculation (would be API call in production)
    if (this.formData.from && this.formData.to) {
      this.formData.distance = '~250 km'; // Dummy value
      this.formData.duration = 'ca. 3 Std.'; // Dummy value
    }
  }

  // Submit
  onPublish(): void {
    console.log('Publishing offer:', this.formData);

    const currentUser = this.authService.getCurrentUser();

    // Create offer via OfferService
    const newOffer = this.offerService.createOffer({
      from: this.formData.from,
      to: this.formData.to,
      date: this.formData.date,
      time: this.formData.time,
      distance: this.formData.distance,
      duration: this.formData.duration,
      vehicleType: this.formData.vehicleType,
      vehicleModel: this.formData.vehicleModel,
      maxWeight: this.formData.maxWeight,
      dimensions: this.formData.dimensions,
      capacity: this.formData.capacity,
      price: this.formData.price,
      description: this.formData.description,
      tags: this.formData.tags,
      pickupLocation: this.formData.pickupLocation,
      dropoffLocation: this.formData.dropoffLocation
    }, currentUser);

    console.log('Offer created successfully:', newOffer);

    this.showSuccessModal = true;
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/my-trips']);
  }

  onCancel(): void {
    if (confirm('Möchtest du wirklich abbrechen? Alle eingegebenen Daten gehen verloren.')) {
      this.router.navigate(['/my-trips']);
    }
  }

  // Helpers
  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getStepTitle(): string {
    switch(this.currentStep) {
      case 1: return 'Route & Datum';
      case 2: return 'Fahrzeug & Kapazität';
      case 3: return 'Preis & Details';
      case 4: return 'Zusammenfassung';
      default: return '';
    }
  }

  formatRoute(): string {
    return `${this.formData.from} → ${this.formData.to}`;
  }

  formatDateTime(): string {
    const date = new Date(this.formData.date);
    return `${date.toLocaleDateString('de-DE')}, ${this.formData.time} Uhr`;
  }
}

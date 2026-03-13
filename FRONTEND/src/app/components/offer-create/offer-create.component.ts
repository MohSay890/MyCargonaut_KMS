import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { OfferService } from '../../services/offer.service';
import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { LocationValidationService } from '../../services/location-validation.service';
import { concatMap, delay } from 'rxjs/operators';

interface OfferFormData {
  // Step 1: Route & Date
  from: string;
  to: string;
  date: string;
  time: string;
  category: string;
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
export class OfferCreateComponent implements OnInit, OnDestroy {

  currentStep: number = 1;
  totalSteps: number = 4;
  isSubmitting: boolean = false;
  isEditMode: boolean = false;
  editOfferId: string | null = null;

  // Form Data
  formData: OfferFormData = {
    from: '',
    to: '',
    date: '',
    time: '',
    category: '',
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

  // Available vehicles (from user's vehicles via VehicleService)
  vehicles: Vehicle[] = [];
  private vehiclesSub: Subscription | null = null;

  // Available tags
  availableTags: string[] = [
    'Versicherung inkl.',
    'Be-/Entladehilfe',
    'Express',
    'Flexible Zeiten',
    'Kühlmöglichkeit',
    'Ladungssicherung'
  ];

  // Modals
  showSuccessModal: boolean = false;
  showNoVehicleModal: boolean = false;
  showValidationModal: boolean = false;
  validationMessage: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private offerService: OfferService,
    private vehicleService: VehicleService,
    private locationValidator: LocationValidationService
  ) {}

  ngOnInit(): void {
    // Load user's active vehicles
    this.vehiclesSub = this.vehicleService.vehicles$.subscribe(vehicles => {
      // Only show active vehicles for offer creation
      this.vehicles = vehicles.filter(v => v.isActive);
      console.log('Loaded active vehicles for offer creation:', this.vehicles.length);
    });
    this.vehicleService.loadVehiclesForCurrentUser();

    // Check if we're in edit mode (URL contains offer ID)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.editOfferId = params['id'];
        this.loadOfferForEdit(params['id']);
      } else {
        // Set default date to tomorrow for new offers
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.formData.date = tomorrow.toISOString().split('T')[0];
        this.formData.time = '08:00';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.vehiclesSub) {
      this.vehiclesSub.unsubscribe();
    }
  }

  loadOfferForEdit(offerId: string): void {
    this.offerService.getOfferById(offerId).subscribe({
      next: (offer) => {
        if (offer) {
          // Populate form with existing offer data
          this.formData.from = offer.from;
          this.formData.to = offer.to;
          // Convert German date format (DD.MM.YYYY) to ISO format (YYYY-MM-DD) for date input
          this.formData.date = this.convertGermanDateToISO(offer.date);
          this.formData.time = offer.time;
          this.formData.category = offer.kategorie || '';
          this.formData.distance = offer.distance || '';
          this.formData.duration = offer.duration || '';
          this.formData.vehicleType = offer.vehicleType || '';
          this.formData.vehicleModel = offer.vehicleModel || '';
          this.formData.maxWeight = offer.maxWeight || 0;
          this.formData.dimensions = offer.dimensions || '';
          this.formData.capacity = offer.capacity || '';
          this.formData.price = offer.price;
          this.formData.description = offer.description || '';
          this.formData.tags = offer.tags || [];
          this.formData.pickupLocation = offer.pickupLocation || '';
          this.formData.dropoffLocation = offer.dropoffLocation || '';
        }
      },
      error: (error) => {
        console.error('Error loading offer for edit:', error);
        alert('Fehler beim Laden der Fahrt. Bitte versuche es erneut.');
        this.router.navigate(['/my-trips']);
      }
    });
  }

  // Navigation
  nextStep(): void {
    if (this.currentStep === 1 && this.validateStep(1)) {
      this.isSubmitting = true;

      
      let results = { fromValid: false, toValid: false, pickupValid: false, dropoffValid: false };

      this.locationValidator.isValidLocationString(this.formData.from).pipe(
        concatMap((res) => {
          results.fromValid = res;
          return this.locationValidator.isValidLocationString(this.formData.to).pipe(delay(1200));
        }),
        concatMap((res) => {
          results.toValid = res;
          return this.locationValidator.isValidLocationString(this.formData.pickupLocation).pipe(delay(1200));
        }),
        concatMap((res) => {
          results.pickupValid = res;
          return this.locationValidator.isValidLocationString(this.formData.dropoffLocation).pipe(delay(1200));
        })
      ).subscribe({
        next: (finalRes) => { results.dropoffValid = finalRes;
          this.isSubmitting = false;
          if (!results.fromValid) {
            this.validationMessage = 'Startort (Von) scheint ungültig oder falsch geschrieben zu sein.';
            this.showValidationModal = true;
            return;
          }
          if (!results.toValid) {
            this.validationMessage = 'Zielort (Nach) scheint ungültig oder falsch geschrieben zu sein.';
            this.showValidationModal = true;
            return;
          }
          if (!results.pickupValid) {
            this.validationMessage = 'Abholadresse scheint ungültig oder falsch geschrieben zu sein. Bitte verwende eine reale Adresse.';
            this.showValidationModal = true;
            return;
          }
          if (!results.dropoffValid) {
              this.validationMessage = 'Lieferadresse scheint ungültig oder falsch geschrieben zu sein. Bitte verwende eine reale Adresse.';
              window.scrollTo(0, 0);
              return;
            }

            if (this.currentStep < this.totalSteps) {
              this.currentStep++;
              window.scrollTo(0, 0);
            }
          },
        error: () => {
          this.isSubmitting = false;
          if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            window.scrollTo(0, 0);
          }
        }
      });
      return;
    }

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
        if (!this.formData.from || !this.formData.to || !this.formData.date || !this.formData.time || !this.formData.category || !this.formData.pickupLocation || !this.formData.dropoffLocation) {
          this.validationMessage = 'Bitte fülle alle Pflichtfelder aus (Von, Nach, Abholadresse, Lieferadresse, Datum, Uhrzeit, Kategorie)';
          this.showValidationModal = true;
          return false;
        }
        return true;

      case 2:
        if (this.vehicles.length === 0) {
          this.showNoVehicleModal = true;
          return false;
        }
        if (!this.formData.vehicleId || !this.formData.maxWeight || !this.formData.dimensions) {
          this.validationMessage = 'Bitte wähle ein Fahrzeug und fülle alle Felder aus';
          this.showValidationModal = true;
          return false;
        }
        return true;

      case 3:
        if (!this.formData.price || this.formData.price <= 0) {
          this.validationMessage = 'Bitte gib einen gültigen Preis ein';
          this.showValidationModal = true;
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  // Vehicle Selection
  selectVehicle(vehicle: Vehicle): void {
    this.formData.vehicleId = vehicle.id?.toString() || '';
    this.formData.vehicleType = vehicle.type || '';
    this.formData.vehicleModel = vehicle.name || '';
    this.formData.maxWeight = vehicle.maxWeight || 0;
    this.formData.dimensions = vehicle.dimensions || '';
    this.formData.capacity = (vehicle.capacity || 0).toString() + ' m³';
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
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    // WICHTIG: Die Feldnamen MÜSSEN zu deinem Java-Backend passen!
    const offerData = {
      startOrt: this.formData.from,         // statt from
      zielOrt: this.formData.to,           // statt to
      datum: this.formData.date,           // statt date
      uhrzeit: this.formData.time,         // statt time
      kategorie: this.formData.category,   // statt category
      entfernung: this.formData.distance,  // statt distance
      dauer: this.formData.duration,       // statt duration
      fahrzeugTyp: this.formData.vehicleType,
      fahrzeugModell: this.formData.vehicleModel,
      freiePlaetze: this.formData.maxWeight, // statt maxWeight
      abmessungen: this.formData.dimensions,
      ladekapazitaet: this.formData.capacity,
      preis: this.formData.price,           // statt price
      beschreibung: this.formData.description,
      // Tags müssen als Komma-String gesendet werden für das Backend-Feld 'extras'
      extras: this.formData.tags.join(', '),
      abholadresse: this.formData.pickupLocation,
      lieferadresse: this.formData.dropoffLocation,
      // Ersteller-Info ist zwingend für "Meine Angebote"
      erstellerEmail: currentUser?.email,
      erstellerName: currentUser?.name || currentUser?.username,
      erstellerAvatar: currentUser?.avatar || 'assets/default-avatar.png'
    };

    if (this.isEditMode && this.editOfferId) {
      this.offerService.updateOffer(this.editOfferId, offerData, currentUser).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccessModal = true;
        },
        error: (error) => {
          console.error('Update Error:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.offerService.createOffer(offerData, currentUser).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccessModal = true;
        },
        error: (error) => {
          console.error('Create Error:', error);
          this.isSubmitting = false;
        }
      });
    }
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

  // Convert German date format (DD.MM.YYYY) to ISO format (YYYY-MM-DD)
  private convertGermanDateToISO(germanDate: string): string {
    if (!germanDate) return '';
    // Check if already in ISO format
    if (germanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return germanDate;
    }
    // Convert from DD.MM.YYYY to YYYY-MM-DD
    const parts = germanDate.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return germanDate;
  }

  getCategoryLabel(): string {
    const categoryMap: { [key: string]: string } = {
      'möbel': 'Möbel',
      'pakete': 'Pakete',
      'umzug': 'Umzug'
    };
    return categoryMap[this.formData.category] || this.formData.category;
  }

  onNoVehicleModalConfirm(): void {
    this.showNoVehicleModal = false;
    this.router.navigate(['/vehicle-editor']);
  }

  onValidationModalClose(): void {
    this.showValidationModal = false;
  }
}

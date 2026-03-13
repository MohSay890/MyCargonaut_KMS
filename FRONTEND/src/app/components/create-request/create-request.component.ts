import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService, TransportRequest } from '../../services/request.service';
import { LocationValidationService } from '../../services/location-validation.service';
import { forkJoin } from 'rxjs';
import { PriceCalculatorComponent } from '../price-calculator/price-calculator.component';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [CommonModule, FormsModule, PriceCalculatorComponent],
  templateUrl: './create-request.component.html',
  styleUrls: ['./create-request.component.css']
})
export class CreateRequestComponent implements OnInit {

  // Form fields
  startOrt: string = '';
  zielOrt: string = '';
  datum: string = '';
  uhrzeit: string = '';
  beschreibung: string = '';
  gewicht: number = 0;
  abmessungen: string = '';
  maxPreis: number = 0;
  kategorie: string = 'Pakete';
  entfernung: string = '';

  // Calculation state
  showPriceCalculator: boolean = true;
  calculatedPrice: number = 0;

  // Edit Mode properties
  isEditMode: boolean = false;
  editRequestId: string | null = null;

  // User info
  erstellerName: string = '';
  erstellerEmail: string = '';
  erstellerAvatar: string = '';

  // State
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private requestService: RequestService,
    private router: Router,
    private route: ActivatedRoute,
    private locationValidator: LocationValidationService
  ) {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      const firstName = user.vorname || user.firstName || '';
      const lastName = user.nachname || user.lastName || '';
      this.erstellerName = (firstName + ' ' + lastName).trim();
      this.erstellerEmail = user.email;
      this.erstellerAvatar = user.avatar || 'https://ui-avatars.com/api/?name=' + firstName + '+' + lastName;
    } else {
      alert('Bitte melde dich an, um eine Anfrage zu erstellen.');
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    // Check if edit mode by reading route params
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editRequestId = id;
        this.loadExistingRequest(this.editRequestId);
      }
    });
  }

  loadExistingRequest(id: string): void {
    this.loading = true;
    this.requestService.getRequestById(id).subscribe({
      next: (req) => {
        if (req) {
          this.startOrt = req.startOrt;
          this.zielOrt = req.zielOrt;
          this.datum = req.datum;
          this.uhrzeit = req.uhrzeit || '';
          this.beschreibung = req.beschreibung || '';
          this.gewicht = req.gewicht || 0;
          this.abmessungen = req.abmessungen || '';
          this.maxPreis = req.maxPreis;
          this.kategorie = req.kategorie || 'Pakete';
          if (req.entfernung) this.entfernung = req.entfernung;
        } else {
          this.error = 'Anfrage nicht gefunden.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading request:', err);
        this.error = 'Fehler beim Laden der Anfrage.';
        this.loading = false;
      }
    });
  }

  onFieldChange(): void {
    // Re-trigger calculation state or other internal logic if inputs change
  }

  canCalculatePrice(): boolean {
    return this.gewicht > 0 && !!this.entfernung && !isNaN(Number(this.entfernung)) && Number(this.entfernung) > 0 && !!this.kategorie;
  }

  onPriceCalculated(price: number): void {
    this.calculatedPrice = price;
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';
    this.loading = true;

    if (!this.startOrt || !this.zielOrt || !this.datum || !this.maxPreis) {
      this.error = 'Bitte fülle alle Pflichtfelder aus (Start, Ziel, Datum, Max. Preis).';
      this.loading = false;
      return;
    }

    if (this.maxPreis <= 0) {
      this.error = 'Der Preis muss größer als 0 sein.';
      this.loading = false;
      return;
    }

    forkJoin({
      startValid: this.locationValidator.isValidLocationString(this.startOrt),
      zielValid: this.locationValidator.isValidLocationString(this.zielOrt)
    }).subscribe({
      next: (results) => {
        if (!results.startValid) {
          this.error = 'Der Startort scheint ungültig oder falsch geschrieben zu sein.';
          this.loading = false;
          return;
        }
        if (!results.zielValid) {
          this.error = 'Der Zielort scheint ungültig oder falsch geschrieben zu sein.';
          this.loading = false;
          return;
        }
        
        this.submitValidatedRequest();
      },
      error: () => {
        this.submitValidatedRequest();
      }
    });
  }

  private submitValidatedRequest(): void {
    const requestData: Partial<TransportRequest> = {
      startOrt: this.startOrt,
      zielOrt: this.zielOrt,
      datum: this.datum,
      uhrzeit: this.uhrzeit || undefined,
      beschreibung: this.beschreibung || undefined,
      gewicht: this.gewicht > 0 ? this.gewicht : undefined,
      abmessungen: this.abmessungen || undefined,
      maxPreis: this.maxPreis,
      kategorie: this.kategorie || 'Pakete',
      entfernung: this.entfernung || undefined,
      erstellerName: this.erstellerName,
      erstellerEmail: this.erstellerEmail,
      erstellerAvatar: this.erstellerAvatar,
      status: 'ACTIVE'
    };

    if (this.isEditMode && this.editRequestId) {
      this.requestService.updateRequest(this.editRequestId, requestData as TransportRequest).subscribe({
        next: (updatedRequest) => {
          this.success = 'Transportanfrage erfolgreich aktualisiert!';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/my-requests']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error updating request:', error);
          this.error = 'Fehler beim Aktualisieren der Anfrage. Bitte versuche es später erneut.';
          this.loading = false;
        }
      });
    } else {
      this.requestService.createRequest(requestData as TransportRequest).subscribe({
        next: (createdRequest) => {
          this.success = 'Transportanfrage erfolgreich erstellt! Fahrer können deine Anfrage jetzt sehen und dir Angebote machen.';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/search'], { queryParams: { mode: 'requests' } });
          }, 3000);
        },
        error: (error) => {
          console.error('Error creating request:', error);
          this.error = 'Fehler beim Erstellen der Anfrage. Bitte versuche es später erneut.';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/search']);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}

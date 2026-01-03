import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService, TransportRequest } from '../../services/request.service';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-request.component.html',
  styleUrls: ['./create-request.component.css']
})
export class CreateRequestComponent {

  // Form fields
  startOrt: string = '';
  zielOrt: string = '';
  datum: string = '';
  uhrzeit: string = '';
  beschreibung: string = '';
  gewicht: number = 0;
  abmessungen: string = '';
  maxPreis: number = 0;
  kategorie: string = '';

  // User info (will be filled from logged-in user)
  erstellerName: string = '';
  erstellerEmail: string = '';
  erstellerAvatar: string = '';

  // Error handling
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private requestService: RequestService,
    private router: Router
  ) {
    // Get user info from localStorage (stored as 'currentUser')
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      // Use vorname/nachname (from login) or firstName/lastName (from registration)
      const firstName = user.vorname || user.firstName || '';
      const lastName = user.nachname || user.lastName || '';
      this.erstellerName = `${firstName} ${lastName}`.trim();
      this.erstellerEmail = user.email;
      this.erstellerAvatar = user.avatar || `https://ui-avatars.com/api/?name=${firstName}+${lastName}`;
    } else {
      // User not logged in, redirect to login
      alert('Bitte melde dich an, um eine Anfrage zu erstellen.');
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    // Clear previous messages
    this.error = '';
    this.success = '';
    this.loading = true;

    // Validation
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

    // Create request object (keep date in ISO format YYYY-MM-DD for backend)
    const newRequest: Partial<TransportRequest> = {
      startOrt: this.startOrt,
      zielOrt: this.zielOrt,
      datum: this.datum,
      uhrzeit: this.uhrzeit || undefined,
      beschreibung: this.beschreibung || undefined,
      gewicht: this.gewicht > 0 ? this.gewicht : undefined,
      abmessungen: this.abmessungen || undefined,
      maxPreis: this.maxPreis,
      kategorie: this.kategorie || undefined,
      erstellerName: this.erstellerName,
      erstellerEmail: this.erstellerEmail,
      erstellerAvatar: this.erstellerAvatar,
      status: 'ACTIVE'
    };

    // Submit to backend
    this.requestService.createRequest(newRequest as TransportRequest).subscribe({
      next: (createdRequest) => {
        this.success = 'Transportanfrage erfolgreich erstellt! Fahrer können deine Anfrage jetzt sehen und dir Angebote machen.';
        this.loading = false;

        // Redirect to search page after 3 seconds to show the success message
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

  onCancel(): void {
    this.router.navigate(['/search']);
  }

  // Helper to get today's date in YYYY-MM-DD format for min date
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}

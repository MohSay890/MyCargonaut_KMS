import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-review-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './review-create.component.html',
  styleUrls: ['./review-create.component.css']
})
export class ReviewCreateComponent implements OnInit {
  // Metadaten der Fahrt
  tripId: string = '';
  displayPartnerName: string = 'Lädt...';
  tripRoute: string = '';
  bewerteterNutzerId: number = 0;

  // Rollen-Logik
  isDriver: boolean = false;

  // Status-Variablen für UI-Sperre und Erfolg
  isSubmitting: boolean = false;
  showSuccessModal: boolean = false;

  // Bewertungsgrundlagen
  overallRating: number = 0;
  reviewComment: string = '';

  // Spezifische Fragen
  questions = {
    puenktlich: true,
    abmachungenEingehalten: true,
    istFreundlich: true,
    wohlgefuehlt: true,
    frachtUnbeschadet: true,
    gerneMitgenommen: true
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = params['id'];
      this.ladeFahrtInfo(this.tripId);
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return new HttpHeaders();

    const user = JSON.parse(userStr);
    const token = user?.token;

    if (token && token !== 'undefined' && token.length > 20) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    return new HttpHeaders();
  }

  ladeFahrtInfo(id: string) {
    const headers = this.getAuthHeaders();
    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    this.http.get<any>(`http://localhost:8080/api/fahrten/${id}`, { headers }).subscribe(fahrt => {
      this.tripRoute = `${fahrt.startOrt} → ${fahrt.zielOrt}`;
      this.isDriver = (fahrt.erstellerEmail === currentUser.email);

      if (this.isDriver) {
        this.displayPartnerName = "Dein Mitfahrer";
      } else {
        this.displayPartnerName = fahrt.erstellerName || 'Fahrer';
      }
    });
  }

  setRating(rating: number): void {
    if (this.isSubmitting) return;
    this.overallRating = rating;
  }

  isFormValid(): boolean {
    return this.overallRating >= 1 && this.overallRating <= 5;
  }

  /**
   * Sendet die Bewertung ab und verhindert Mehrfacheingaben
   */
  onSubmitReview(): void {
    if (this.isSubmitting || !this.isFormValid()) return;

    this.isSubmitting = true; // Sperrt den Button sofort

    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const headers = this.getAuthHeaders();

    const payload = {
      autor: { id: currentUser.id },
      fahrt: { id: parseInt(this.tripId) },
      sterne: this.overallRating,
      kommentar: this.reviewComment,
      istFreundlich: this.questions.istFreundlich,
      puenktlich: this.questions.puenktlich,
      abmachungenEingehalten: this.questions.abmachungenEingehalten,
      wohlgefuehlt: this.isDriver ? null : this.questions.wohlgefuehlt,
      frachtUnbeschadet: this.isDriver ? null : this.questions.frachtUnbeschadet,
      gerneMitgenommen: this.isDriver ? this.questions.gerneMitgenommen : null,
      istSichtbar: false
    };

    this.http.post('http://localhost:8080/api/bewertungen', payload, { headers }).subscribe({
      next: () => {
        this.showSuccessModal = true;
        // Button bleibt gesperrt (isSubmitting = true)
      },
      error: (err) => {
        this.isSubmitting = false; // Bei Fehler wieder freigeben
        alert(err.error?.message || 'Sie haben diese Fahrt bereits bewertet.');
      }
    });
  }

  // Nachdem der User im Modal auf "OK" klickt -> Startseite
  onSuccessConfirm(): void {
    this.router.navigate(['/']);
  }

  onCancel(): void {
    this.router.navigate(['/my-trips']);
  }
}

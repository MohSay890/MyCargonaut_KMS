import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService, Booking } from '../../services/booking.service';

@Component({
  selector: 'app-booking-request-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onClose()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Buchungsanfrage</h2>
          <button class="btn-close" (click)="onClose()">✕</button>
        </div>

        <div class="modal-body" *ngIf="booking">
          <!-- Passenger Info -->
          <div class="passenger-section">
            <h3>👤 Fahrgast</h3>
            <div class="passenger-info">
              <div class="passenger-avatar">
                {{ getInitials(booking.mitfahrer?.vorname, booking.mitfahrer?.nachname) }}
              </div>
              <div class="passenger-details">
                <strong>{{ getPassengerName(booking) }}</strong>
                <p>{{ booking.mitfahrer?.email }}</p>
              </div>
            </div>
          </div>

          <!-- Trip Info -->
          <div class="trip-section">
            <h3>🚗 Fahrt</h3>
            <div class="trip-info">
              <div class="info-row">
                <span class="label">Route:</span>
                <span class="value">{{ getTripRoute(booking) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Datum:</span>
                <span class="value">{{ formatDate(booking.fahrt?.datum) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Uhrzeit:</span>
                <span class="value">{{ booking.fahrt?.uhrzeit }} Uhr</span>
              </div>
              <div class="info-row">
                <span class="label">Anzahl Plätze:</span>
                <span class="value">{{ booking.anzahlPlaetze }} {{ booking.anzahlPlaetze === 1 ? 'Platz' : 'Plätze' }}</span>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div class="message-section" *ngIf="booking.nachricht">
            <h3>💬 Nachricht</h3>
            <div class="message-box">
              {{ booking.nachricht }}
            </div>
          </div>

          <!-- Booking Details -->
          <div class="details-section">
            <h3>📋 Details</h3>
            <div class="info-row">
              <span class="label">Anfrage vom:</span>
              <span class="value">{{ formatDateTime(booking.erstelltAm) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value status-pending">Ausstehend</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="btn-message"
            (click)="onSendMessage()"
            [disabled]="isProcessing">
            💬 Nachricht senden
          </button>
          <button
            class="btn-reject"
            (click)="onReject()"
            [disabled]="isProcessing">
            <span *ngIf="!isProcessing">❌ Ablehnen</span>
            <span *ngIf="isProcessing">Wird abgelehnt...</span>
          </button>
          <button
            class="btn-accept"
            (click)="onAccept()"
            [disabled]="isProcessing">
            <span *ngIf="!isProcessing">✅ Annehmen</span>
            <span *ngIf="isProcessing">Wird angenommen...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    }

    .modal-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .modal-header h2 {
      font-family: 'Urbanist', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #666;
      cursor: pointer;
      padding: 0.5rem;
      line-height: 1;
      transition: color 0.3s ease;
    }

    .btn-close:hover {
      color: #1a1a1a;
    }

    .modal-body {
      padding: 2rem;
    }

    .passenger-section,
    .trip-section,
    .message-section,
    .details-section {
      margin-bottom: 2rem;
    }

    .passenger-section h3,
    .trip-section h3,
    .message-section h3,
    .details-section h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 1rem;
    }

    .passenger-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .passenger-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .passenger-details strong {
      display: block;
      font-size: 1.1rem;
      color: #1a1a1a;
      margin-bottom: 0.25rem;
    }

    .passenger-details p {
      color: #666;
      margin: 0;
      font-size: 0.9rem;
    }

    .trip-info,
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      color: #666;
      font-weight: 500;
    }

    .value {
      color: #1a1a1a;
      font-weight: 600;
    }

    .status-pending {
      color: #f59e0b;
      background: #fef3c7;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .message-box {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 12px;
      border-left: 4px solid #10b981;
      color: #1a1a1a;
      line-height: 1.6;
      font-style: italic;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 2px solid #f0f0f0;
    }

    .btn-reject,
    .btn-accept {
      padding: 0.875rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      min-width: 150px;
    }

    .btn-reject {
      background: #fef2f2;
      color: #dc2626;
      border: 2px solid #fee2e2;
    }

    .btn-reject:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #dc2626;
    }

    .btn-accept {
      background: #10b981;
      color: white;
    }

    .btn-accept:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-reject:disabled,
    .btn-accept:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-message {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: 2px solid var(--primary);
      background: white;
      color: var(--primary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-message:hover:not(:disabled) {
      background: var(--primary);
      color: white;
    }

    .btn-message:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class BookingRequestModalComponent {
  @Input() isOpen: boolean = false;
  @Input() booking: Booking | null = null;
  @Input() creatorEmail: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() accepted = new EventEmitter<Booking>();
  @Output() rejected = new EventEmitter<Booking>();

  isProcessing: boolean = false;

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  onClose(): void {
    if (!this.isProcessing) {
      this.close.emit();
    }
  }

  onSendMessage(): void {
    if (!this.booking || !this.booking.mitfahrer) return;

    const passengerEmail = this.booking.mitfahrer.email;
    const passengerName = this.getPassengerName(this.booking);
    const passengerAvatar = this.booking.mitfahrer.profilbild;

    // Close modal and navigate to messages
    this.close.emit();
    this.router.navigate(['/messages'], {
      state: {
        recipientEmail: passengerEmail,
        recipientName: passengerName,
        recipientAvatar: passengerAvatar
      }
    });
  }

  onAccept(): void {
    if (!this.booking || !this.creatorEmail || this.isProcessing) return;

    this.isProcessing = true;
    this.bookingService.confirmBooking(this.booking.id, this.creatorEmail).subscribe({
      next: (updatedBooking) => {
        console.log('Booking confirmed:', updatedBooking);
        this.isProcessing = false;
        this.accepted.emit(updatedBooking);
        this.close.emit();
      },
      error: (error) => {
        console.error('Error confirming booking:', error);
        this.isProcessing = false;
        alert('Fehler beim Annehmen der Buchung. Bitte versuche es erneut.');
      }
    });
  }

  onReject(): void {
    if (!this.booking || !this.creatorEmail || this.isProcessing) return;

    if (!confirm('Möchtest du diese Buchungsanfrage wirklich ablehnen?')) {
      return;
    }

    this.isProcessing = true;
    this.bookingService.rejectBooking(this.booking.id, this.creatorEmail).subscribe({
      next: (updatedBooking) => {
        console.log('Booking rejected:', updatedBooking);
        this.isProcessing = false;
        this.rejected.emit(updatedBooking);
        this.close.emit();
      },
      error: (error) => {
        console.error('Error rejecting booking:', error);
        this.isProcessing = false;
        alert('Fehler beim Ablehnen der Buchung. Bitte versuche es erneut.');
      }
    });
  }

  getPassengerName(booking: Booking): string {
    if (booking.mitfahrer?.vorname && booking.mitfahrer?.nachname) {
      return `${booking.mitfahrer.vorname} ${booking.mitfahrer.nachname}`;
    }
    return booking.mitfahrer?.email || 'Unbekannt';
  }

  getInitials(vorname?: string, nachname?: string): string {
    if (vorname && nachname) {
      return `${vorname[0]}${nachname[0]}`.toUpperCase();
    }
    return '??';
  }

  getTripRoute(booking: Booking): string {
    if (booking.fahrt?.startort && booking.fahrt?.zielort) {
      return `${booking.fahrt.startort} → ${booking.fahrt.zielort}`;
    }
    return 'Nicht verfügbar';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Nicht verfügbar';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString?: string): string {
    if (!dateString) return 'Nicht verfügbar';
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
